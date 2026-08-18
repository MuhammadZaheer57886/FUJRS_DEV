"use client";

// The products a vendor is marketing, as rows in `affiliate_links`.
//
// The table is `unique (vendor_id, product_id)`, which is what makes "taking
// the same link twice refreshes rather than duplicates" a database fact rather
// than adapter discipline.
//
// Title and price are joined, never stored: unlike an order line, a link is
// not a record of what something cost — it is a pointer to a live product, and
// a vendor promoting a repriced piece should see the current price.

import { DEFAULT_COMMISSION, type CommissionRate, type CommissionStatus } from "@/lib/commission";
import type { AffiliateStore } from "../ports";
import { StoreWriteError, type AffiliateLink } from "../types";
import { getBrowserClient } from "./client";
import { requireUserId } from "./identity";

const toPkr = (paisa: number) => paisa / 100;

interface LinkRow {
  id: string;
  created_at: string;
  products: { slug: string; title: string; price_paisa: number } | null;
}

const LINK_SELECT = "id, created_at, products ( slug, title, price_paisa )";

function toLink(row: LinkRow): AffiliateLink | null {
  if (!row.products) return null;
  return {
    id: row.id,
    productSlug: row.products.slug,
    productTitle: row.products.title,
    productPrice: toPkr(row.products.price_paisa),
    createdAt: row.created_at,
  };
}

export const supabaseAffiliate: AffiliateStore = {
  async listLinks() {
    const vendorId = await requireUserId();

    const { data, error } = await getBrowserClient()
      .from("affiliate_links")
      .select(LINK_SELECT)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load your links.");

    // A link to an archived product drops out rather than rendering blank.
    return ((data as unknown as LinkRow[] | null) ?? [])
      .map(toLink)
      .filter((link): link is AffiliateLink => link !== null);
  },

  async addLink(product) {
    const vendorId = await requireUserId();
    const supabase = getBrowserClient();

    const { data: row } = await supabase
      .from("products")
      .select("id")
      .eq("slug", product.slug)
      .is("archived_at", null)
      .maybeSingle();

    if (!row) throw new StoreWriteError("That product is no longer available.");

    // onConflict on the unique pair: re-taking a link touches the existing row
    // instead of failing on the constraint.
    const { data, error } = await supabase
      .from("affiliate_links")
      .upsert({ vendor_id: vendorId, product_id: row.id }, { onConflict: "vendor_id,product_id" })
      .select(LINK_SELECT)
      .single();

    if (error || !data) throw new StoreWriteError("Couldn't save that link.");

    const link = toLink(data as unknown as LinkRow);
    if (!link) throw new StoreWriteError("Couldn't save that link.");
    return link;
  },

  async removeLink(id) {
    const vendorId = await requireUserId();

    // Scoped to the vendor as well as the id: RLS already enforces it, and
    // saying it here means a bug can't turn into deleting someone else's row.
    const { error } = await getBrowserClient()
      .from("affiliate_links")
      .delete()
      .eq("id", id)
      .eq("vendor_id", vendorId);

    if (error) throw new StoreWriteError("Couldn't remove that link.");
  },

  async performance() {
    const vendorId = await requireUserId();
    const supabase = getBrowserClient();

    const [{ count: clicks }, { data: commissions }, { data: me }] = await Promise.all([
      // head:true asks for the count without shipping the rows — a popular
      // vendor could have tens of thousands, and nothing here reads them.
      // Scoped by `referral_clicks_own_read`; writes stay server-only.
      supabase
        .from("referral_clicks")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", vendorId),
      supabase.from("commissions").select("amount_paisa, status").eq("vendor_id", vendorId),
      supabase
        .from("users")
        .select("commission_type, commission_value, referral_code")
        .eq("id", vendorId)
        .maybeSingle(),
    ]);

    const sum = (statuses: string[]) =>
      (commissions ?? [])
        .filter((row) => statuses.includes(row.status))
        .reduce((total, row) => total + toPkr(row.amount_paisa), 0);

    return {
      clicks: clicks ?? 0,
      // A reversed commission is a refunded sale — it should not still count
      // as one on the vendor's own scoreboard.
      sales: (commissions ?? []).filter((row) => row.status !== "REVERSED").length,
      earned: sum(["CREDITED", "PAID"]),
      pending: sum(["PENDING"]),
      commission: {
        type: (me?.commission_type as CommissionRate["type"]) ?? DEFAULT_COMMISSION.type,
        value: Number(me?.commission_value ?? DEFAULT_COMMISSION.value),
      },
      referralCode: me?.referral_code ?? null,
    };
  },

  /**
   * Through an RPC, not an embed off `commissions`.
   *
   * The embed used to be `orders ( order_number, order_items ( title ) )`, and
   * it came back null on every row: RLS filters embedded resources too, and a
   * vendor matches no policy on `orders` (the order is the customer's, and
   * is_staff() is ADMIN/SUPER_ADMIN only). So the table showed a real
   * commission against a blank product and a blank order number.
   *
   * `vendor_referred_sales()` is security definer and returns only the order
   * reference and the line titles, so nothing about the buyer leaks to pay for
   * fixing the display. See the migration for why a read policy on `orders` is
   * the wrong answer.
   */
  async referredSales() {
    const { data, error } = await getBrowserClient().rpc("vendor_referred_sales");

    if (error) throw new StoreWriteError("Couldn't load your referred sales.");

    return (data ?? []).map((row) => {
      const titles = row.item_titles ?? [];
      return {
        id: row.id,
        orderNumber: row.order_number,
        // An order can hold several pieces; naming the first and counting the
        // rest is honest without pretending the commission belongs to one.
        product:
          titles.length === 0
            ? "-"
            : titles.length === 1
              ? titles[0]
              : `${titles[0]} +${titles.length - 1} more`,
        salePrice: toPkr(row.sale_paisa),
        // Read back, never recalculated: the rate was copied onto the row when
        // the sale happened, and a later rate change must not rewrite history.
        commission: toPkr(row.amount_paisa),
        rate: {
          type: row.rate_type as CommissionRate["type"],
          value: Number(row.rate_value),
        },
        status: row.status as CommissionStatus,
        date: row.created_at.slice(0, 10),
      };
    });
  },
};
