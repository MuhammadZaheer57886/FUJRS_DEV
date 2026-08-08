"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, cartTotals } from "@/components/cart/CartContext";
import type { CatalogItem } from "@/lib/data";
import { AddToBagButton } from "@/components/product/AddToBagButton";
import { LinkButton } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/Loading";
import { ProductImage } from "@/components/ui/ProductImage";

/** Accessories offered alongside the bag, by slug. */
const COMPLETE_THE_LOOK_SLUGS = [
  "antique-gold-zardozi-khussa",
  "mughal-pearl-chandbalis",
  "gilded-silk-frame-clutch",
  "cream-needlework-pashmina",
];

export function CartView({ products }: { products: CatalogItem[] }) {
  const completeTheLook = products.filter((p) => COMPLETE_THE_LOOK_SLUGS.includes(p.slug));
  const { items, removeItem, updateQty, mounted } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  if (!mounted) {
    return (
      <main className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex items-center justify-center">
        <LoadingScreen label="Loading your bag" />
      </main>
    );
  }

  const { fabricTotal, stitchingTotal, shipping, total } = cartTotals(items);

  function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    setPromoMessage(
      promoCode.trim()
        ? "Promo codes aren't available yet — check back soon."
        : "Enter a code first."
    );
  }

  if (items.length === 0) {
    return (
      <main className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">
          shopping_bag
        </span>
        <h2 className="mt-6 font-display-lg text-headline-md uppercase tracking-tight">
          Your Bag is Empty
        </h2>
        <p className="mt-2 font-body-md text-on-surface-variant">
          Browse the collection and add something beautiful.
        </p>
        <LinkButton href="/new-arrivals" variant="primary" className="mt-8 !px-12 !py-5">
          Continue Shopping
        </LinkButton>
      </main>
    );
  }

  return (
    <main className="pt-12 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="mb-12">
        <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md uppercase tracking-tight">
          Shopping Bag ({items.length})
        </h2>
        <div className="h-[1px] w-24 bg-primary mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-primary">
                Sold by FUJRS
              </span>
              <span
                className="material-symbols-outlined text-[16px] text-marketplace-bronze"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          {items.map((item) => (
            <div
              key={`${item.id}-${item.stitching ? "stitched" : "plain"}`}
              className="flex flex-col md:flex-row gap-6 py-6 border-b border-outline-variant/30"
            >
              <Link
                href={
                  item.slug.startsWith("bespoke") ? "/tailoring/review" : `/products/${item.slug}`
                }
                className="w-full md:w-40 aspect-[4/5] bg-surface-container overflow-hidden relative shrink-0"
              >
                <ProductImage
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </Link>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm">{item.title}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mt-1">
                      Product ID: {item.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <p className="font-label-md text-label-md">PKR {item.price.toLocaleString()}</p>
                </div>

                {item.stitching && (
                  <div className="mt-4 p-4 bg-surface-container-low border-l-2 border-tertiary-fixed">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">architecture</span>
                        <span className="font-label-md text-label-md uppercase">
                          Custom Stitching Service
                        </span>
                      </div>
                      <p className="font-label-md text-label-md">
                        PKR {item.stitching.addOn.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">
                      Style: {item.stitching.label}
                    </p>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-6">
                  <div className="flex items-center border border-black px-3 py-1">
                    <button
                      aria-label="Decrease quantity"
                      className="hover:text-primary-container"
                      onClick={() => updateQty(item.id, item.qty - 1, !!item.stitching)}
                    >
                      −
                    </button>
                    <span className="px-6 font-label-md">{item.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      className="hover:text-primary-container"
                      onClick={() => updateQty(item.id, item.qty + 1, !!item.stitching)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, !!item.stitching)}
                    className="text-label-sm font-label-sm uppercase tracking-tighter border-b border-black hover:opacity-50 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-32">
          <div className="p-8 bg-surface-container-lowest border border-outline-variant">
            <h3 className="font-label-md text-label-md uppercase tracking-[0.2em] mb-8">
              Order Summary
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-on-surface-variant">
                <span className="font-label-sm text-label-sm uppercase">Fabric Total</span>
                <span className="font-label-md text-label-md">
                  PKR {fabricTotal.toLocaleString()}
                </span>
              </div>
              {stitchingTotal > 0 && (
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase">Stitching Total</span>
                  <span className="font-label-md text-label-md">
                    PKR {stitchingTotal.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span className="font-label-sm text-label-sm uppercase">Shipping Total</span>
                <span className="font-label-md text-label-md">PKR {shipping.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                <span className="font-label-md text-label-md uppercase text-primary">
                  Total Amount
                </span>
                <span className="font-headline-sm text-headline-sm">
                  PKR {total.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <LinkButton
                href="/checkout"
                variant="primary"
                className="w-full !py-4 active:scale-[0.98] transition-transform"
              >
                Proceed to Checkout
              </LinkButton>
              <div className="flex items-center gap-2 justify-center py-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="text-label-sm font-label-sm uppercase">Secure Checkout</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-outline-variant">
              <label
                htmlFor="promo-code"
                className="font-label-sm text-label-sm uppercase block mb-3"
              >
                Promotional Code
              </label>
              <form className="flex gap-2" onSubmit={handleApplyPromo}>
                <input
                  id="promo-code"
                  className="flex-1 bg-transparent border border-outline-variant px-4 py-2 font-label-sm focus:ring-0 focus:border-primary outline-none"
                  placeholder="ENTER CODE"
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-6 border border-primary font-label-sm uppercase hover:bg-primary hover:text-on-primary transition-colors"
                >
                  Apply
                </button>
              </form>
              {promoMessage && (
                <p className="mt-2 text-label-sm font-label-sm text-on-surface-variant">
                  {promoMessage}
                </p>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-start gap-4 p-4 border border-tertiary-fixed bg-tertiary-fixed/5">
                <span className="material-symbols-outlined text-marketplace-bronze">
                  local_shipping
                </span>
                <div>
                  <p className="font-label-md text-label-md">Complimentary Shipping</p>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">
                    Your order qualifies for premium domestic shipping across Pakistan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Complete the Look — hidden entirely when none of those accessories
          are in the catalogue, rather than a heading over an empty grid. */}
      {completeTheLook.length > 0 && (
        <section className="mt-32">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                Curated for You
              </span>
              <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md mt-2">
                Complete the Look
              </h2>
            </div>
            <Link
              href="/new-arrivals"
              className="font-label-md text-label-md uppercase border-b border-black"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {completeTheLook.map((product) => (
              <div key={product.id} className="group">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-[4/5] bg-surface-container overflow-hidden mb-4">
                    <ProductImage
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-primary text-on-primary font-label-sm py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 uppercase tracking-widest text-center">
                      <AddToBagButton product={product} label="Quick Add" />
                    </div>
                  </div>
                </Link>
                <div className="space-y-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    FUJRS
                  </p>
                  <h4 className="font-body-md text-body-md">{product.title}</h4>
                  <p className="font-label-md text-label-md">
                    PKR {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
