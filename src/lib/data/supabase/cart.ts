"use client";

// The bag, as rows in `cart_items` owned by the shopper's uuid.
//
// Prices are NOT stored on a line — the migration is explicit about why: a
// cart shows the CURRENT price, and only an order snapshots it. So a read
// joins `products` and rebuilds the line from live data. Leaving an item in
// the bag for a month therefore checks out at this month's price, which is the
// behaviour the storefront should have.
//
// The port is `read`/`write` of a whole array, which is how the provider was
// built. That maps to "replace my lines": simpler than diffing, and correct,
// because a bag is small and entirely owned by one user.

import type { CartStore } from "../ports";
import { StoreWriteError, type CartLine } from "../types";
import { getBrowserClient } from "./client";
import { currentUserId, ensureUserId } from "./identity";

const toPaisa = (pkr: number) => Math.round(pkr * 100);
const toPkr = (paisa: number) => paisa / 100;

interface CartRow {
  id: string;
  quantity: number;
  stitching_label: string | null;
  stitching_addon_paisa: number | null;
  stitcher_slug: string | null;
  products: {
    slug: string;
    title: string;
    price_paisa: number;
    product_images: { storage_path: string; position: number }[] | null;
  } | null;
}

export const supabaseCart: CartStore = {
  async read() {
    // No session means an empty bag, not an error: this runs on first paint,
    // before anyone has done anything worth creating a user row for.
    const userId = await currentUserId();
    if (!userId) return [];

    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `id, quantity, stitching_label, stitching_addon_paisa, stitcher_slug,
         products ( slug, title, price_paisa, product_images ( storage_path, position ) )`
      )
      .eq("user_id", userId)
      .order("added_at", { ascending: true });

    if (error) throw new StoreWriteError("Couldn't load your bag.");

    return (
      ((data as unknown as CartRow[] | null) ?? [])
        // A line whose product was archived has nothing to show or price, so it
        // drops out of the bag rather than rendering as a blank row.
        .filter((row): row is CartRow & { products: NonNullable<CartRow["products"]> } =>
          Boolean(row.products)
        )
        .map((row): CartLine => {
          const primary = [...(row.products.product_images ?? [])].sort(
            (a, b) => a.position - b.position
          )[0];

          return {
            id: row.id,
            slug: row.products.slug,
            title: row.products.title,
            image: primary
              ? /^https?:\/\//i.test(primary.storage_path)
                ? primary.storage_path
                : supabase.storage.from("product-images").getPublicUrl(primary.storage_path).data
                    .publicUrl
              : "",
            price: toPkr(row.products.price_paisa),
            qty: row.quantity,
            stitching: row.stitching_label
              ? {
                  label: row.stitching_label,
                  addOn: toPkr(row.stitching_addon_paisa ?? 0),
                }
              : undefined,
            stitcherSlug: row.stitcher_slug ?? undefined,
          };
        })
    );
  },

  async write(lines) {
    // Writing implies intent, so this is where a guest gets their uuid.
    const userId = await ensureUserId();
    const supabase = getBrowserClient();

    // Resolve slugs to ids: the line carries a slug, the table a foreign key.
    const slugs = [...new Set(lines.map((line) => line.slug))];
    const { data: products } = slugs.length
      ? await supabase.from("products").select("id, slug").in("slug", slugs)
      : { data: [] };

    const idBySlug = new Map((products ?? []).map((p) => [p.slug, p.id]));

    const rows = lines
      // The bespoke line has no product row, so it cannot be stored here. It
      // lives in the tailoring draft until checkout turns it into an order
      // item — dropping it silently is why `read` won't return it either.
      .filter((line) => idBySlug.has(line.slug))
      .map((line) => ({
        user_id: userId,
        product_id: idBySlug.get(line.slug)!,
        quantity: line.qty,
        stitching_label: line.stitching?.label ?? null,
        stitching_addon_paisa: line.stitching ? toPaisa(line.stitching.addOn) : null,
        stitcher_slug: line.stitcherSlug ?? null,
      }));

    // Replace wholesale. Deleting first means a removed line actually goes,
    // which an upsert alone would not achieve.
    const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (clearError) throw new StoreWriteError("Couldn't update your bag.");

    if (rows.length === 0) return;

    const { error } = await supabase.from("cart_items").insert(rows);
    if (error) throw new StoreWriteError("Couldn't update your bag.");
  },
};
