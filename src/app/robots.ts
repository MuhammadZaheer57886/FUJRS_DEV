import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { sitemap: absoluteUrl("/sitemap.xml") }
      : {}),
  };
}