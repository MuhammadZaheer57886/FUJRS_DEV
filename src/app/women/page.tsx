import { catalogRead } from "@/lib/data/server";
import { WomenCollection } from "./WomenCollection";
import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Women's Unstitched Suits in Pakistan",
  description:
    "Shop FUJRS women's unstitched lawn, chiffon, silk, and net suits with heritage craftsmanship.",
  alternates: siteOrigin ? { canonical: "/women" } : undefined,
};

/**
 * Server shell: reads the catalogue, then hands it to the client component
 * that owns the fabric tabs. The fetch stays on the server so the collection
 * renders with its pieces already in the HTML rather than after a round trip.
 */
export default async function WomenPage() {
  return <WomenCollection products={await catalogRead.list()} />;
}
