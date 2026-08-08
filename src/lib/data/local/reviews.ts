// Reviews on the browser-only backend.
//
// Kept in localStorage per product slug, so the PDP behaves the same way it
// does against the database — write one, see it, edit it. It is visible only in
// the browser that wrote it, which is what `local` means everywhere else too.
//
// The verified-purchase badge is honest here: it checks the orders actually
// placed in this browser rather than always awarding it.

import { readSession } from "@/lib/auth/session";
import type { ReviewStore } from "../ports";
import { MAX_REVIEW_RATING, MIN_REVIEW_RATING, StoreWriteError, type Review } from "../types";
import { localOrders } from "./orders";
import { makeId, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-reviews";

/** Stored shape — the domain `Review` is derived per reader. */
interface StoredReview {
  id: string;
  productSlug: string;
  authorEmail: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
}

const readAll = (): StoredReview[] => readJSON<StoredReview[]>(KEY, []);

export const localReviews: ReviewStore = {
  async listForProduct(productSlug) {
    const viewer = readSession()?.email ?? null;

    return readAll()
      .filter((review) => review.productSlug === productSlug)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((review): Review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        authorName: review.authorName,
        createdAt: review.createdAt,
        verifiedPurchase: review.verifiedPurchase,
        mine: review.authorEmail === viewer,
      }));
  },

  async submit(productSlug, review) {
    const session = readSession();
    if (!session) throw new StoreWriteError("You need to be signed in to leave a review.");

    const rating = Math.round(review.rating);
    if (rating < MIN_REVIEW_RATING || rating > MAX_REVIEW_RATING) {
      throw new StoreWriteError("Choose a rating from one to five.");
    }

    // Earned from an order in this browser, not assumed.
    const orders = await localOrders.list();
    const verifiedPurchase = orders.some((order) =>
      order.items.some((item) => item.productSlug === productSlug)
    );

    const all = readAll();
    const existing = all.find(
      (r) => r.productSlug === productSlug && r.authorEmail === session.email
    );

    const next: StoredReview = {
      // One per person per product: editing keeps the id and the original date.
      id: existing?.id ?? makeId(),
      productSlug,
      authorEmail: session.email,
      authorName: session.name || "FUJRS Customer",
      rating,
      title: review.title?.trim() || null,
      body: review.body?.trim() || null,
      verifiedPurchase,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    writeJSON(KEY, [...all.filter((r) => r.id !== next.id), next]);
    return this.listForProduct(productSlug);
  },

  async remove(id) {
    writeJSON(
      KEY,
      readAll().filter((review) => review.id !== id)
    );
  },
};
