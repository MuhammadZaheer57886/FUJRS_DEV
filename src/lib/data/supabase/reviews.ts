"use client";

// Product reviews, from `reviews`.
//
// `products.rating` and `products.review_count` are maintained by a trigger on
// this table, so nothing here touches them. A component that wrote a rating by
// hand would be the start of the two disagreeing.

import type { ReviewStore } from "../ports";
import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  StoreWriteError,
  type NewReview,
  type Review,
} from "../types";
import { getBrowserClient } from "./client";
import { currentUserId, requireUserId } from "./identity";

const REVIEW_SELECT = `
  id, rating, title, body, created_at, user_id, order_id,
  users ( name, email )
`;

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_id: string;
  order_id: string | null;
  users: { name: string | null; email: string | null } | null;
}

/**
 * Who wrote it, as a shopper should see it.
 *
 * A first name and a surname initial: a full name beside a delivery address in
 * the same system is more than a review page needs to expose, and an email
 * here would be a gift to a scraper.
 */
function displayName(user: ReviewRow["users"]): string {
  const raw = (user?.name ?? "").trim();
  if (!raw) return "FUJRS Customer";

  const [first, ...rest] = raw.split(/\s+/);
  return rest.length === 0 ? first : `${first} ${rest[rest.length - 1][0]}.`;
}

async function listFor(productId: string, viewerId: string | null): Promise<Review[]> {
  const { data, error } = await getBrowserClient()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new StoreWriteError("Couldn't load reviews for this piece.");

  return ((data as unknown as ReviewRow[] | null) ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: displayName(row.users),
    createdAt: row.created_at,
    verifiedPurchase: row.order_id !== null,
    mine: row.user_id === viewerId,
  }));
}

/** The product's uuid, which is what `reviews` keys on. */
async function productIdFor(slug: string): Promise<string | null> {
  const { data } = await getBrowserClient()
    .from("products")
    .select("id")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();

  return data?.id ?? null;
}

export const supabaseReviews: ReviewStore = {
  async listForProduct(productSlug) {
    const productId = await productIdFor(productSlug);
    if (!productId) return [];

    // No session is fine — reviews are public. It only decides which one is
    // marked as the reader's own.
    return listFor(productId, await currentUserId());
  },

  async submit(productSlug, review: NewReview) {
    const userId = await requireUserId();

    const productId = await productIdFor(productSlug);
    if (!productId) throw new StoreWriteError("That piece is no longer available.");

    const rating = Math.round(review.rating);
    if (rating < MIN_REVIEW_RATING || rating > MAX_REVIEW_RATING) {
      throw new StoreWriteError("Choose a rating from one to five.");
    }

    const supabase = getBrowserClient();

    // A verified-purchase badge has to be earned from an actual order, not
    // claimed. Finding one is best-effort: no order simply means no badge.
    const { data: purchased } = await supabase
      .from("order_items")
      .select("order_id, orders!inner ( user_id )")
      .eq("product_id", productId)
      .eq("orders.user_id", userId)
      .limit(1)
      .maybeSingle();

    // onConflict on (product_id, user_id): editing your review replaces it,
    // rather than failing on the unique index or stacking duplicates.
    const { error } = await supabase.from("reviews").upsert(
      {
        product_id: productId,
        user_id: userId,
        order_id: purchased?.order_id ?? null,
        rating,
        title: review.title?.trim() || null,
        body: review.body?.trim() || null,
      },
      { onConflict: "product_id,user_id" }
    );

    if (error) {
      // 42501 is RLS: the writer is an anonymous guest, which the policy
      // refuses on purpose.
      throw new StoreWriteError(
        error.code === "42501"
          ? "You need a registered account to leave a review."
          : "Couldn't save your review."
      );
    }

    return listFor(productId, userId);
  },

  async remove(id) {
    // RLS decides: your own review, or any review if you're staff moderating.
    const { error } = await getBrowserClient().from("reviews").delete().eq("id", id);
    if (error) throw new StoreWriteError("Couldn't remove that review.");
  },
};
