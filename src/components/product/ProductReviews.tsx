"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { reviews as reviewStore, MAX_REVIEW_RATING, MIN_REVIEW_RATING } from "@/lib/data";
import type { Review } from "@/lib/data";

const RATINGS = Array.from(
  { length: MAX_REVIEW_RATING - MIN_REVIEW_RATING + 1 },
  (_, i) => MAX_REVIEW_RATING - i
);

function Stars({ rating, label }: { rating: number; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={label ?? `${rating} out of ${MAX_REVIEW_RATING}`}
    >
      {Array.from({ length: MAX_REVIEW_RATING }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`material-symbols-outlined text-[16px] ${
            i < rating ? "text-marketplace-bronze" : "text-outline-variant"
          }`}
          style={i < rating ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          star
        </span>
      ))}
    </span>
  );
}

/** The rating picker. Radios, not stars-as-buttons, so it works by keyboard. */
function RatingChooser({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <fieldset>
      <legend className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        Your Rating
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {[...RATINGS].reverse().map((rating) => (
          <label
            key={rating}
            className={`flex cursor-pointer items-center gap-2 border px-3 py-2 transition-colors ${
              value === rating
                ? "border-marketplace-bronze text-marketplace-bronze"
                : "border-outline-variant hover:border-marketplace-bronze"
            }`}
          >
            <input
              type="radio"
              name="rating"
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              className="sr-only"
            />
            <Stars rating={rating} label={`${rating} star${rating === 1 ? "" : "s"}`} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  // A guest has a session but `reviews_write_own` requires a durable account
  // (`not is_anonymous_user()`), so showing them the form would offer a submit
  // that RLS rejects. They get the same sign-in prompt as someone signed out.
  const { session, isGuest } = useAuth();
  const canReview = Boolean(session) && !isGuest;
  const { toast } = useToast();

  const [list, setList] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(MAX_REVIEW_RATING);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setList(await reviewStore.listForProduct(productSlug));
    } catch {
      setList([]);
    }
  }, [productSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mine = list?.find((review) => review.mine) ?? null;

  // Editing loads the existing review once, rather than on every render, so
  // typing isn't fighting the fetched values.
  useEffect(() => {
    if (!mine) return;
    setRating(mine.rating);
    setTitle(mine.title ?? "");
    setBody(mine.body ?? "");
  }, [mine]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      setList(await reviewStore.submit(productSlug, { rating, title, body }));
      toast(mine ? "Your review has been updated." : "Thank you — your review is live.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your review.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await reviewStore.remove(id);
    await refresh();
    setRating(MAX_REVIEW_RATING);
    setTitle("");
    setBody("");
    toast("Your review has been removed.", "info");
  }

  const average =
    list && list.length > 0
      ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10
      : null;

  return (
    <section className="mt-32">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h3 className="font-headline-md text-headline-md text-primary">Reviews</h3>
        {average !== null && (
          <p className="flex items-center gap-2 font-label-md text-text-muted">
            <Stars rating={Math.round(average)} />
            {average} out of {MAX_REVIEW_RATING} · {list?.length}{" "}
            {list?.length === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {!list && <Loading label="Loading reviews" />}

          {list?.length === 0 && (
            <p className="font-body text-body-md text-text-muted">
              No reviews yet. If you own this piece, yours would be the first.
            </p>
          )}

          <ul className="divide-y divide-border-subtle">
            {list?.map((review) => (
              <li key={review.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={review.rating} />
                  <span className="font-label-md text-primary">{review.authorName}</span>
                  {review.verifiedPurchase && (
                    <span className="border border-marketplace-bronze px-2 py-0.5 font-label-sm text-[10px] uppercase tracking-widest text-marketplace-bronze">
                      Verified Purchase
                    </span>
                  )}
                  <span className="font-label-sm text-label-sm text-text-muted">
                    {review.createdAt.slice(0, 10)}
                  </span>
                </div>

                {review.title && (
                  <p className="mt-3 font-display text-body-lg text-on-surface">{review.title}</p>
                )}
                {review.body && (
                  <p className="mt-2 max-w-prose font-body text-body-md text-on-surface-variant">
                    {review.body}
                  </p>
                )}

                {review.mine && (
                  <button
                    onClick={() => void handleRemove(review.id)}
                    className="mt-3 font-label-sm text-label-sm uppercase tracking-widest text-text-muted underline underline-offset-4 transition-colors hover:text-error"
                  >
                    Remove my review
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          {canReview ? (
            <form onSubmit={handleSubmit} noValidate className="border border-outline-variant p-8">
              <h4 className="font-display text-headline-sm">
                {mine ? "Edit your review" : "Write a review"}
              </h4>

              <div className="mt-6 space-y-5">
                <RatingChooser value={rating} onChange={setRating} />
                <TextField
                  label="Headline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  hint="Optional."
                  placeholder="Beautifully finished"
                />
                <TextAreaField
                  label="Your Review"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  hint="Optional. How does it fit, drape and wear?"
                />
              </div>

              {error && (
                <p role="alert" className="mt-4 font-label-sm text-label-sm text-error">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="mt-6 w-full" disabled={saving}>
                {saving ? "Saving…" : mine ? "Update Review" : "Submit Review"}
              </Button>
            </form>
          ) : (
            <div className="border border-outline-variant p-8">
              <h4 className="font-display text-headline-sm">Write a review</h4>
              <p className="mt-3 font-body text-body-md text-text-muted">
                Sign in to leave one. Reviews are tied to an account so the shop can stand behind
                them — that&apos;s also what earns the Verified Purchase badge.
              </p>
              <LinkButton href="/login" variant="secondary" className="mt-6">
                Sign In
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
