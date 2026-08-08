"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { AddToBagButton } from "@/components/product/AddToBagButton";
import type { CatalogItem } from "@/lib/data";
import { ProductImage } from "@/components/ui/ProductImage";
import { Swatch } from "@/components/ui/OptionPickers";

export function MenProductTile({
  product,
  size = "small",
  delay = 0,
}: {
  product: CatalogItem;
  size?: "large" | "small";
  delay?: number;
}) {
  const aspect = size === "large" ? "aspect-[16/10]" : "aspect-[4/5]";

  return (
    <Reveal delay={delay} className={size === "large" ? "md:col-span-8" : "md:col-span-4"}>
      <div className="group relative product-card overflow-hidden">
        <Link
          href={`/products/${product.slug}`}
          className={`block ${aspect} overflow-hidden relative`}
        >
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            fill
            sizes={size === "large" ? "66vw" : "33vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.badge && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="bg-black text-white px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider">
                {product.badge}
              </span>
            </div>
          )}
          <div className="quick-add-btn absolute bottom-0 left-0 right-0 bg-black text-white py-4 font-label-md text-label-md uppercase tracking-widest text-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <AddToBagButton
              product={product}
              label={size === "large" ? "Quick Add to Bag" : "Quick Add"}
            />
          </div>
        </Link>
        <div className="mt-6 flex justify-between items-start">
          <div>
            <h3
              className={
                size === "large"
                  ? "font-headline-sm text-headline-sm mb-1 uppercase tracking-tight"
                  : "font-label-md text-label-md font-bold uppercase tracking-widest mb-1"
              }
            >
              {product.title}
            </h3>
            <p className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm uppercase">
              <Swatch hex={product.colorHex} size={12} />
              {product.color} {product.meters !== null && `• ${product.meters}m`}
            </p>
          </div>
          <p className="font-headline-sm text-headline-sm shrink-0 ml-4">
            PKR {product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
