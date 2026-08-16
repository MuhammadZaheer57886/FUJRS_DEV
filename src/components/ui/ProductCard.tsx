"use client";

import Link from "next/link";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import type { CatalogItem } from "@/lib/data";
import { ProductImage } from "@/components/ui/ProductImage";

export function ProductCard({ product }: { product: CatalogItem }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted, mounted } = useWishlist();
  const wishlisted = mounted && isWishlisted(product.slug);

  return (
    <div className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container">
          <ProductImage
            src={product.images[0]?.url}
            focal={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
          <ProductImage
            src={(product.images[1] ?? product.images[0])?.url}
            focal={product.images[1] ?? product.images[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNewArrival && <Badge variant="gold">New</Badge>}
            {product.compareAtPrice && <Badge variant="dark">Sale</Badge>}
          </div>
          <button
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggle(product);
            }}
            className="material-symbols-outlined absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-surface-container-lowest/90 text-[20px]"
          >
            {wishlisted ? "favorite" : "favorite_border"}
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-body-md text-on-surface">{product.title}</p>
          <p className="text-body-md text-text-muted">{product.fabric}</p>
          <div className="flex items-center gap-2">
            <p className="text-body-md font-medium text-on-surface">
              PKR {product.price.toLocaleString()}
            </p>
            {product.compareAtPrice && (
              <p className="text-body-md text-text-muted line-through">
                PKR {product.compareAtPrice.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Link>
      <Button
        variant="secondary"
        className="mt-3 w-full !py-2.5 text-label-sm"
        onClick={() => addItem(product)}
      >
        Add to Bag
      </Button>
    </div>
  );
}
