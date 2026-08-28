import { notFound } from "next/navigation";
import Link from "next/link";
import { EditorialGallery } from "@/components/product/EditorialGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { SpecsAccordion } from "@/components/product/SpecsAccordion";
import { CompleteTheLook } from "@/components/product/CompleteTheLook";
import { ProductReviews } from "@/components/product/ProductReviews";
import { catalogRead } from "@/lib/data/server";
import type { ProductGender } from "@/lib/data";
import type { Metadata } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/seo";

/**
 * There is no /unisex collection, so those pieces breadcrumb to New Arrivals
 * rather than a 404 — the gender enum has three values, the site has two
 * gendered collections.
 */
const collectionHref = (gender: ProductGender) =>
  gender === "Unisex" ? "/new-arrivals" : `/${gender.toLowerCase()}`;

/**
 * Pre-renders a page per product at build time. A piece published after the
 * build still works — `dynamicParams` defaults to true, so an unknown slug is
 * rendered on demand and cached — but the catalogue as it stands ships static.
 */
export async function generateStaticParams() {
  const products = await catalogRead.list();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await catalogRead.getBySlug((await params).slug);
  if (!product) return {};

  return {
    title: product.title,
    description: product.description,
    alternates: siteOrigin ? { canonical: `/products/${product.slug}` } : undefined,
    openGraph: {
      type: "website",
      title: product.title,
      description: product.description,
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.title }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await catalogRead.getBySlug(resolvedParams.slug);
  if (!product) notFound();

  const products = await catalogRead.list();

  // "Complete the Look": same-category pieces first, falling back to
  // accessories so the section is never empty.
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category
  );
  const accessoryCategories = ["Accessories", "Jewelry", "Footwear"];
  const accessories = products.filter(
    (p) => p.id !== product.id && accessoryCategories.includes(p.category)
  );
  const completeTheLook = [...sameCategory, ...accessories]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku ?? undefined,
    image: product.images.map((image) => image.url),
    brand: { "@type": "Brand", name: "FUJRS" },
    offers: {
      "@type": "Offer",
      ...(siteOrigin ? { url: absoluteUrl(`/products/${product.slug}`) } : {}),
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.rating !== null && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        ...(siteOrigin ? { item: absoluteUrl("/") } : {}),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.gender,
        ...(siteOrigin ? { item: absoluteUrl(collectionHref(product.gender)) } : {}),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        ...(siteOrigin
          ? { item: absoluteUrl(`/products/${product.slug}`) }
          : {}),
      },
    ],
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 mb-8 font-label-sm text-text-muted uppercase tracking-wider"
      >
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="text-[10px]">/</span>
        <Link href={collectionHref(product.gender)} className="hover:text-primary">
          {product.gender}
        </Link>
        <span className="text-[10px]">/</span>
        <span className="text-primary">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <EditorialGallery images={product.images} title={product.title} />
        <PurchasePanel product={product} />
      </div>

      <div className="lg:grid lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7">
          <SpecsAccordion product={product} />
        </div>
      </div>

      <ProductReviews productSlug={product.slug} />

      <CompleteTheLook items={completeTheLook} />
    </div>
  );
}
