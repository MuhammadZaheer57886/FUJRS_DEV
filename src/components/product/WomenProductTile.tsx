"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { AddToBagButton } from "@/components/product/AddToBagButton";
import type { CatalogItem } from "@/lib/data";
import { ProductImage } from "@/components/ui/ProductImage";
import { ColorLine } from "@/components/product/ColorLine";

export function WomenProductTile({
  product,
  span,
  quickAddLabel,
  delay = 0,
  offset = false,
}: {
  product: CatalogItem;
  span: "large" | "medium" | "normal";
  quickAddLabel: string;
  delay?: number;
  offset?: boolean;
}) {
  const colSpan = span === "large" ? "md:col-span-8" : "md:col-span-4";
  const aspect = span === "large" ? "aspect-[16/9]" : "aspect-[4/5]";

  return (
    <Reveal delay={delay} className={`${colSpan} ${offset ? "mt-8" : ""} group cursor-pointer`}>
      <Link
        href={`/products/${product.slug}`}
        className={`relative ${aspect} overflow-hidden mb-6 block`}
      >
        <ProductImage
          src={product.images[0]?.url}
          focal={product.images[0]}
          alt={product.title}
          fill
          sizes={span === "large" ? "66vw" : "33vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.badge && (
          <div className="absolute top-6 left-6">
            <span className="bg-primary text-on-primary font-label-sm text-label-sm px-3 py-1 uppercase tracking-widest">
              {product.badge}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-0 left-0 w-full p-gutter translate-y-0 transition-transform bg-primary text-on-primary flex justify-between items-center md:translate-y-full md:group-hover:translate-y-0 md:group-focus-within:translate-y-0">
          <AddToBagButton product={product} label={quickAddLabel} />
          <span className="material-symbols-outlined">add</span>
        </div>
      </Link>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{product.title}</h3>
          <p className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase text-secondary tracking-widest">
            <ColorLine colors={product.colors} />
          </p>
        </div>
        <p className="font-body-lg text-body-lg text-primary shrink-0 ml-4">
          PKR {product.price.toLocaleString()}
        </p>
      </div>
    </Reveal>
  );
}
