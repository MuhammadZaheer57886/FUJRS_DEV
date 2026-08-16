import Link from "next/link";
import { catalogRead } from "@/lib/data/server";
import { AddToBagButton } from "@/components/product/AddToBagButton";
import { ProductImage } from "@/components/ui/ProductImage";

/** Homepage strip: the four newest pieces flagged as new arrivals. */
const HOMEPAGE_SLOTS = 4;

export async function NewArrivalsGrid() {
  const items = (await catalogRead.list()).filter((p) => p.isNewArrival).slice(0, HOMEPAGE_SLOTS);

  // A homepage band headed "New Arrivals" with nothing under it reads as a
  // broken page. With no arrivals to show, the section simply isn't there.
  if (items.length === 0) return null;

  return (
    <section className="py-margin-desktop bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-headline-md text-headline-md">New Arrivals</h2>
            <p className="text-on-surface-variant font-body-md">
              Hand-picked luxury for the discerning eye.
            </p>
          </div>
          <Link
            href="/new-arrivals"
            className="font-label-md text-label-md uppercase tracking-widest border-b border-primary hover:text-tertiary-fixed-dim transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
          {items.map((product) => (
            <div key={product.id} className="product-card group relative">
              <div className="aspect-[4/5] bg-surface-container-highest overflow-hidden relative">
                <Link href={`/products/${product.slug}`} className="block h-full w-full">
                  <ProductImage
                    src={product.images[0]?.url}
                    focal={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-primary text-on-primary text-[10px] px-2 py-1 uppercase tracking-tighter">
                      {product.badge ?? "New Arrival"}
                    </span>
                  </div>
                </Link>
                <div className="quick-add-bar absolute bottom-0 left-0 w-full bg-primary py-4 text-center opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <AddToBagButton product={product} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <h4 className="font-headline-sm text-[18px] mb-2">{product.title}</h4>
                <p className="font-label-md text-label-md">PKR {product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
