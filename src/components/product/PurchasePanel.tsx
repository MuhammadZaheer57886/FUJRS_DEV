"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import type { CatalogItem } from "@/lib/data";
import { Button } from "@/components/ui/Button";

/** FUJRS is single-brand — every piece is made in the same atelier. */
const ATELIER_NAME = "The FUJRS Atelier";

export function PurchasePanel({ product }: { product: CatalogItem }) {
  const [qty, setQty] = useState(1);
  const [stitched, setStitched] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addItem } = useCart();
  const { toggle, isWishlisted, mounted } = useWishlist();
  const wishlisted = mounted && isWishlisted(product.slug);

  // Whether stitching is offered is a property of the piece now, not a guess
  // from its sizes: a product is stitchable when an Admin priced it that way.
  const stitchingAddOn = product.stitchingAddOn;
  const offersStitching = product.stitchingEligible && stitchingAddOn !== null;

  function handleAddToBag() {
    addItem(
      product,
      qty,
      stitched && stitchingAddOn !== null
        ? { label: "Signature Style, Standard Measurements", addOn: stitchingAddOn }
        : undefined
    );
    setFeedback(stitched ? `Added ${qty} with Bespoke Stitching to bag.` : `Added ${qty} to bag.`);
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="lg:col-span-5 flex flex-col gap-8 lg:sticky lg:top-32 h-fit">
      <section className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-label-md text-label-md text-marketplace-bronze uppercase tracking-widest mb-1">
              {product.category}
            </p>
            <h2 className="font-headline-md text-headline-md text-primary leading-tight">
              {product.title}
            </h2>
          </div>
          <button
            aria-label="Share"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({ title: product.title, url: window.location.href })
                  .catch(() => {});
              }
            }}
            className="text-primary hover:text-marketplace-bronze transition-colors"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
        <div className="flex items-end gap-3">
          <span className="font-headline-sm text-headline-sm text-primary">
            PKR {product.price.toLocaleString()}
          </span>
          {product.sku && (
            <span className="font-label-sm text-text-muted mb-1">SKU: {product.sku}</span>
          )}
        </div>
        {/* The description belongs beside the price, not in the accordion
            below: it's what the shopper reads to decide, and the accordion
            sections are all collapsed by default. */}
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {product.description}
        </p>
      </section>

      {/* Atelier badge — adapted from source's marketplace seller badge.
          Every piece is made in-house, so this is the brand, not a per-product
          seller: which Master Stitcher takes a job is decided when a stitching
          request is assigned, not on the product row. */}
      <div className="border border-border-subtle p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-container flex items-center justify-center border border-outline">
            <span className="font-headline-sm text-primary">{ATELIER_NAME.charAt(0)}</span>
          </div>
          <div>
            <p className="font-label-md text-primary uppercase">{ATELIER_NAME}</p>
            {/* Reviews aren't built yet, so a piece with no rating shows none
                rather than a zero, which would read as "rated badly". */}
            {product.rating !== null && (
              <div className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-[14px] text-marketplace-bronze"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label-sm text-text-muted">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
        <Link
          href="/tailoring/stitchers"
          className="font-label-sm text-primary underline underline-offset-4 uppercase tracking-widest hover:text-marketplace-bronze transition-colors"
        >
          View Profile
        </Link>
      </div>

      {/* Bespoke Stitching Module */}
      {offersStitching && (
        <div className="border border-marketplace-bronze/20 bg-surface-container-low p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-marketplace-bronze">
                architecture
              </span>
              <h3 className="font-label-md text-primary uppercase tracking-widest">
                Bespoke Stitching
              </h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                className="sr-only peer"
                type="checkbox"
                checked={stitched}
                onChange={(e) => setStitched(e.target.checked)}
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marketplace-bronze" />
            </label>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm">
            Hand-finished by Master Tailors in our signature style or custom measurements. Includes
            lining and premium finishing materials.
          </p>
          <ul className="space-y-2">
            {["7-Day Priority Delivery", "Complimentary Design Consultation"].map((item) => (
              <li key={item} className="flex items-center gap-2 font-label-sm text-primary">
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                {item.toUpperCase()}
              </li>
            ))}
          </ul>
          {stitched && (
            <div className="font-label-md text-marketplace-bronze border-t border-marketplace-bronze/10 pt-4 flex justify-between">
              <span>STITCHING SERVICE</span>
              <span>+ PKR {stitchingAddOn?.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Purchase Actions */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-32 border border-black flex items-center justify-between px-4">
            <button
              aria-label="Decrease quantity"
              className="h-12 flex items-center justify-center hover:text-marketplace-bronze"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="font-label-md">{qty}</span>
            <button
              aria-label="Increase quantity"
              className="h-12 flex items-center justify-center hover:text-marketplace-bronze"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
          <Button onClick={handleAddToBag} variant="primary" className="flex-1 !py-4">
            Add to Bag
          </Button>
        </div>
        <Button onClick={() => toggle(product)} variant="secondary" className="w-full !py-4">
          <span className="material-symbols-outlined text-[18px]">
            {wishlisted ? "favorite" : "favorite_border"}
          </span>
          {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
        </Button>
        {feedback && (
          <p role="status" className="text-label-sm text-marketplace-bronze">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
