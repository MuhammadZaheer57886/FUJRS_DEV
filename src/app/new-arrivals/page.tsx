import { ProductFilterGrid } from "@/components/ui/ProductFilterGrid";
import { LinkButton } from "@/components/ui/Button";
import { catalogRead } from "@/lib/data/server";
import { EmptyCatalogue } from "@/components/ui/EmptyCatalogue";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Discover the latest ready-to-wear and unstitched fashion from FUJRS in Pakistan.",
  alternates: siteOrigin ? { canonical: "/new-arrivals" } : undefined,
};

export default async function NewArrivalsPage() {
  const newArrivals = (await catalogRead.list()).filter((p) => p.isNewArrival);
  const [spotlight, ...rest] = newArrivals;

  return (
    <div className="py-12">
      <div className="container-luxe">
        <p className="label-caps text-gold">Just Landed</p>
        <h1 className="mt-2 font-display text-headline-md">New Arrivals</h1>
      </div>

      {newArrivals.length === 0 && (
        <div className="container-luxe mt-10">
          <EmptyCatalogue what="new arrivals" />
        </div>
      )}

      {spotlight && (
        <div className="container-luxe mt-10 grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-container lg:aspect-auto">
            <ProductImage
              src={spotlight.images[0]?.url}
              focal={spotlight.images[0]}
              alt={spotlight.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="label-caps text-gold">Spotlight</p>
            <h2 className="mt-3 font-display text-headline-md">{spotlight.title}</h2>
            <p className="mt-4 max-w-md text-body-md text-text-muted">{spotlight.description}</p>
            <p className="mt-4 text-headline-sm font-display">
              PKR {spotlight.price.toLocaleString()}
            </p>
            <LinkButton
              href={`/products/${spotlight.slug}`}
              variant="primary"
              className="mt-6 w-fit"
            >
              Shop This Piece
            </LinkButton>
          </div>
        </div>
      )}

      <div className="container-luxe mt-16">
        <h2 className="font-display text-headline-sm mb-8">More New In</h2>
        {rest.length > 0 && <ProductFilterGrid products={rest} />}
      </div>
    </div>
  );
}
