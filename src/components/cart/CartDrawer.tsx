"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, cartTotals } from "@/components/cart/CartContext";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button, LinkButton } from "@/components/ui/Button";

/**
 * The bag, slid in over whatever the shopper was looking at.
 *
 * Adding a piece used to move a number in the navbar and nothing else, which
 * is indistinguishable from the click not registering. This answers the two
 * questions that follow it, "what did I just add" and "how do I take it back
 * off", without leaving the grid: the whole point of a drawer over a route is
 * that closing it puts the shopper back exactly where they were.
 *
 * Mounted once, in the root layout, and it owns nothing: the lines, the
 * removals and the open flag all live in `CartProvider`, so the navbar count
 * and the full bag page never disagree with what is on screen here.
 */
export function CartDrawer() {
  const pathname = usePathname();
  const { items, removeItem, updateQty, drawerOpen, closeDrawer } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  /**
   * Off-canvas for one frame so the panel slides in rather than appearing.
   * A CSS transition needs a start state that was actually painted.
   */
  const [shown, setShown] = useState(false);

  // The bag page and checkout ARE the bag. A drawer over either would cover
  // the same lines with a smaller copy of themselves.
  const redundantHere = pathname === "/cart" || pathname === "/checkout";

  useEffect(() => {
    if (drawerOpen && redundantHere) closeDrawer();
  }, [drawerOpen, redundantHere, closeDrawer]);

  // Closes itself on navigation, so "View Bag" doesn't leave the panel sitting
  // over the page it just opened.
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  const open = drawerOpen && !redundantHere;

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }

    const frame = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();

    // The page behind must not scroll under the panel, on a phone especially,
    // where the drawer is the whole viewport.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeDrawer]);

  if (!open) return null;

  const { fabricTotal, stitchingTotal, subtotal } = cartTotals(items);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`absolute inset-0 bg-primary/50 backdrop-blur-sm transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-outline-variant bg-surface shadow-lg transition-transform duration-300 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-5">
          <div>
            <h2
              id="cart-drawer-title"
              className="font-label-md text-label-md uppercase tracking-[0.2em]"
            >
              Added to Bag
            </h2>
            <p className="mt-1 font-body text-label-sm text-on-surface-variant">
              {count} {count === 1 ? "item" : "items"} in your bag
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close bag"
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center transition-colors hover:text-marketplace-bronze"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-4xl text-on-surface-variant"
            >
              shopping_bag
            </span>
            <p className="font-body text-body-md text-on-surface-variant">
              Your bag is empty again.
            </p>
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Keep Shopping
            </Button>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-outline-variant/40 overflow-y-auto px-6">
            {items.map((item) => (
              <li
                key={`${item.id}-${item.stitching ? "stitched" : "plain"}`}
                className="flex gap-4 py-5"
              >
                <Link
                  href={
                    item.slug.startsWith("bespoke") ? "/tailoring/review" : `/products/${item.slug}`
                  }
                  onClick={closeDrawer}
                  className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-surface-container"
                >
                  <ProductImage src={item.image} alt={item.title} fill className="object-cover" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={
                        item.slug.startsWith("bespoke")
                          ? "/tailoring/review"
                          : `/products/${item.slug}`
                      }
                      onClick={closeDrawer}
                      className="font-headline-sm text-body-md transition-colors hover:text-marketplace-bronze"
                    >
                      {item.title}
                    </Link>
                    <p className="shrink-0 font-label-md text-label-md tabular-nums">
                      PKR {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>

                  {item.stitching && (
                    <p className="mt-1 font-body text-label-sm text-on-surface-variant">
                      Stitching · {item.stitching.label}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="flex items-center border border-outline-variant">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        disabled={item.qty <= 1}
                        onClick={() => updateQty(item.id, item.qty - 1, !!item.stitching)}
                        className="px-3 py-1 transition-colors hover:text-marketplace-bronze disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="px-3 font-label-sm text-label-sm tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() => updateQty(item.id, item.qty + 1, !!item.stitching)}
                        className="px-3 py-1 transition-colors hover:text-marketplace-bronze"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id, !!item.stitching)}
                      className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant underline underline-offset-4 transition-colors hover:text-error"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <footer className="border-t border-outline-variant px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                Subtotal
              </span>
              <span className="font-headline-sm text-headline-sm tabular-nums">
                PKR {subtotal.toLocaleString()}
              </span>
            </div>
            {stitchingTotal > 0 && (
              <p className="mt-1 font-body text-label-sm text-on-surface-variant tabular-nums">
                Fabric PKR {fabricTotal.toLocaleString()} · Stitching PKR{" "}
                {stitchingTotal.toLocaleString()}
              </p>
            )}
            <p className="mt-1 font-body text-label-sm text-text-muted">
              Delivery is added at checkout.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <LinkButton href="/cart" variant="secondary" className="w-full !px-4">
                View Bag
              </LinkButton>
              <LinkButton href="/checkout" variant="primary" className="w-full !px-4">
                Checkout
              </LinkButton>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="mt-4 w-full font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Keep Shopping
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
