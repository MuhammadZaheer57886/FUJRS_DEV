import { catalogRead } from "@/lib/data/server";
import { MenCollection } from "./MenCollection";
import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Men's Unstitched Fabrics in Pakistan",
  description:
    "Shop FUJRS men's unstitched Egyptian cotton, Latha, Karandi, and wash and wear fabrics.",
  alternates: siteOrigin ? { canonical: "/men" } : undefined,
};

/**
 * Server shell: reads the catalogue, then hands it to the client component
 * that owns the fabric tabs. The fetch stays on the server so the collection
 * renders with its pieces already in the HTML rather than after a round trip.
 */
export default async function MenPage() {
  return <MenCollection products={await catalogRead.list()} />;
}
