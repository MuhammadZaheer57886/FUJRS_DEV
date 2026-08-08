"use client";

// Saved products, as rows in `wishlist_items` owned by the shopper's uuid.
//
// The port speaks in slugs because that is what the storefront has; the table
// keys on product_id. Translating here is the whole job.

import type { WishlistStore } from "../ports";
import { StoreWriteError } from "../types";
import { getBrowserClient } from "./client";
import { currentUserId, ensureUserId } from "./identity";

export const supabaseWishlist: WishlistStore = {
  async read() {
    // No session means nothing saved, not an error — same reasoning as the bag.
    const userId = await currentUserId();
    if (!userId) return [];

    const { data, error } = await getBrowserClient()
      .from("wishlist_items")
      .select("products ( slug )")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load your wishlist.");

    return ((data as unknown as { products: { slug: string } | null }[] | null) ?? [])
      .map((row) => row.products?.slug)
      .filter((slug): slug is string => Boolean(slug));
  },

  async write(slugs) {
    // Nothing saved and nobody signed in means the provider is persisting its
    // initial state, not a shopper saving something. Same reasoning as the bag:
    // don't mint a guest row to hold an empty list.
    if (slugs.length === 0 && !(await currentUserId())) return;

    const userId = await ensureUserId();
    const supabase = getBrowserClient();

    const { data: products } = slugs.length
      ? await supabase.from("products").select("id, slug").in("slug", slugs)
      : { data: [] };

    // Replace wholesale, for the same reason as the bag: a removed slug has to
    // actually disappear, which an upsert alone wouldn't do.
    const { error: clearError } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", userId);
    if (clearError) throw new StoreWriteError("Couldn't update your wishlist.");

    const rows = (products ?? []).map((product) => ({ user_id: userId, product_id: product.id }));
    if (rows.length === 0) return;

    const { error } = await supabase.from("wishlist_items").insert(rows);
    if (error) throw new StoreWriteError("Couldn't update your wishlist.");
  },
};
