"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/data";
import { DEFAULT_STITCHER_SLUG } from "@/data/stitchers";
import { orderTotals } from "@/lib/pricing";
import { cart } from "@/lib/data";
import type { CartLine, StitchingSelection } from "@/lib/data";

// Re-exported so the many components importing these from the provider keep
// working. The shapes themselves live in the data layer — one definition.
export type { StitchingSelection };
export type CartItem = CartLine;

interface CartContextValue {
  items: CartItem[];
  addItem: (
    product: CatalogItem,
    qty?: number,
    stitching?: StitchingSelection,
    stitcherSlug?: string
  ) => void;
  addCustomItem: (item: {
    id: string;
    slug: string;
    title: string;
    image: string;
    price: number;
    stitching?: StitchingSelection;
    stitcherSlug?: string;
  }) => void;
  removeItem: (id: string, stitched?: boolean) => void;
  updateQty: (id: string, qty: number, stitched?: boolean) => void;
  clear: () => void;
  mounted: boolean;
  /**
   * The bag drawer. Adding a piece used to change nothing but a number in the
   * navbar, which reads as "did that work?", so the bag slides open over the
   * page instead: what was added, at what price, with the way to take it back
   * off right there. It is state rather than a route so the shopper never
   * loses the grid they were browsing.
   */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKeyById(id: string, stitched: boolean) {
  return `${id}::${stitched ? "stitched" : "plain"}`;
}

function lineKeyBySlug(slug: string, stitched: boolean) {
  return `${slug}::${stitched ? "stitched" : "plain"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** What the store already holds, so an unchanged bag isn't written back. */
  const persisted = useRef<string>(JSON.stringify([]));

  // Storage lives in the data layer, so this provider holds React state only
  // and swaps backends with everything else. See BACKEND_SETUP.md §1.
  useEffect(() => {
    let active = true;
    cart
      .read()
      .then((lines) => {
        if (!active) return;
        persisted.current = JSON.stringify(lines);
        setItems(lines);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Skip the write until the first read has landed, or an empty initial
    // state would overwrite a real saved bag.
    if (!mounted) return;

    // And skip it when nothing has actually changed. `mounted` flipping true
    // fires this effect once with whatever `read()` returned, so without the
    // comparison every page load writes the bag straight back — a round trip
    // that saves nothing, and for a signed-out visitor a guest account created
    // to hold an empty bag.
    const snapshot = JSON.stringify(items);
    if (snapshot === persisted.current) return;
    persisted.current = snapshot;

    void cart.write(items);
  }, [items, mounted]);

  function addItem(
    product: CatalogItem,
    qty = 1,
    stitching?: StitchingSelection,
    stitcherSlug?: string
  ) {
    setItems((prev) => {
      const key = lineKeyBySlug(product.slug, !!stitching);
      const existing = prev.find((i) => lineKeyBySlug(i.slug, !!i.stitching) === key);
      if (existing) {
        return prev.map((i) =>
          lineKeyBySlug(i.slug, !!i.stitching) === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          // A snapshot of the URL: the bag thumbnail must keep showing what was
          // added even if the product's photography is replaced later.
          image: product.images[0]?.url ?? "",
          price: product.price,
          qty,
          stitching,
          stitcherSlug: stitching ? (stitcherSlug ?? DEFAULT_STITCHER_SLUG) : undefined,
        },
      ];
    });
    setDrawerOpen(true);
  }

  /**
   * A bespoke project, which arrives from the tailoring journey rather than a
   * product grid. Deliberately does NOT open the drawer: that flow sends the
   * customer to the full bag itself, and a drawer would be a panel that opens
   * only to be navigated out from under.
   */
  function addCustomItem(item: {
    id: string;
    slug: string;
    title: string;
    image: string;
    price: number;
    stitching?: StitchingSelection;
    stitcherSlug?: string;
  }) {
    setItems((prev) => [...prev, { ...item, qty: 1 }]);
  }

  function removeItem(id: string, stitched = false) {
    const key = lineKeyById(id, stitched);
    setItems((prev) => prev.filter((i) => lineKeyById(i.id, !!i.stitching) !== key));
  }

  function updateQty(id: string, qty: number, stitched = false) {
    const key = lineKeyById(id, stitched);
    setItems((prev) =>
      prev.map((i) =>
        lineKeyById(i.id, !!i.stitching) === key ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
  }

  function clear() {
    setItems([]);
  }

  // Stable identities: the drawer closes itself on navigation from an effect
  // keyed on these, and a fresh arrow every render would fire that effect on
  // every render, shutting the panel the same tick `addItem` opened it.
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addCustomItem,
        removeItem,
        updateQty,
        clear,
        mounted,
        drawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/**
 * Bag totals. The arithmetic itself is in `@/lib/pricing`, because the server
 * recomputes it when the order is placed and the two must not drift.
 */
export function cartTotals(items: CartItem[]) {
  return orderTotals(
    items.map((item) => ({
      price: item.price,
      qty: item.qty,
      stitchingAddOn: item.stitching?.addOn,
    }))
  );
}
