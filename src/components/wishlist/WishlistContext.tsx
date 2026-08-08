"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/data";
import { wishlist } from "@/lib/data";

interface WishlistContextValue {
  slugs: string[];
  toggle: (product: CatalogItem) => void;
  isWishlisted: (slug: string) => boolean;
  mounted: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  /** What the store already holds, so an unchanged list isn't written back. */
  const persisted = useRef<string>(JSON.stringify([]));

  // Storage lives in the data layer; this provider holds React state only.
  useEffect(() => {
    let active = true;
    wishlist
      .read()
      .then((saved) => {
        if (!active) return;
        persisted.current = JSON.stringify(saved);
        setSlugs(saved);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Skip until the first read lands, or an empty initial state would
    // overwrite a real saved wishlist.
    if (!mounted) return;

    // Skip it again when the list matches what was read — see CartContext for
    // why: the mount-time write is what was minting a guest account per visit.
    const snapshot = JSON.stringify(slugs);
    if (snapshot === persisted.current) return;
    persisted.current = snapshot;

    void wishlist.write(slugs);
  }, [slugs, mounted]);

  function toggle(product: CatalogItem) {
    setSlugs((prev) =>
      prev.includes(product.slug) ? prev.filter((s) => s !== product.slug) : [...prev, product.slug]
    );
  }

  function isWishlisted(slug: string) {
    return slugs.includes(slug);
  }

  return (
    <WishlistContext.Provider value={{ slugs, toggle, isWishlisted, mounted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
