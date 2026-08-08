"use client";

import { LinkButton } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import type { CatalogItem } from "@/lib/data";
import { LoadingScreen } from "@/components/ui/Loading";

export function WishlistGrid({ products }: { products: CatalogItem[] }) {
  const { slugs, mounted } = useWishlist();

  if (!mounted) {
    return (
      <div className="container-luxe flex min-h-[50vh] items-center justify-center py-24">
        <LoadingScreen label="Loading your wishlist" />
      </div>
    );
  }

  const wishlisted = products.filter((p) => slugs.includes(p.slug));

  if (wishlisted.length === 0) {
    return (
      <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-5xl text-text-muted">favorite_border</span>
        <h1 className="mt-6 font-display text-headline-md">Your wishlist is empty</h1>
        <p className="mt-2 text-body-md text-text-muted">
          Tap the heart on any piece to save it here.
        </p>
        <LinkButton href="/new-arrivals" variant="primary" className="mt-8">
          Browse Collections
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="container-luxe py-12">
      <h1 className="font-display text-headline-md">Wishlist</h1>
      <p className="mt-2 text-body-md text-text-muted">
        {wishlisted.length} {wishlisted.length === 1 ? "piece" : "pieces"} saved
      </p>
      <div className="mt-10 grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
        {wishlisted.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
