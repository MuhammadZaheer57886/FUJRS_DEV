import type { MetadataRoute } from "next";
import { stitchers } from "@/data/stitchers";
import { catalogRead } from "@/lib/data/server";
import { absoluteUrl } from "@/lib/seo";

const publicPaths = [
  "/",
  "/about",
  "/men",
  "/women",
  "/new-arrivals",
  "/tailoring",
  "/tailoring/stitchers",
  "/contact",
  "/faqs",
  "/size-guide",
  "/shipping-policy",
  "/returns-exchanges",
  "/privacy-policy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SITE_URL) return [];

  const products = await catalogRead.list();
  return [
    ...publicPaths.map((path) => ({ url: absoluteUrl(path) })),
    ...products.map((product) => ({ url: absoluteUrl(`/products/${product.slug}`) })),
    ...stitchers.map((stitcher) => ({
      url: absoluteUrl(`/tailoring/stitchers/${stitcher.slug}`),
    })),
  ];
}