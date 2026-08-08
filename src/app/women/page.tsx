import { catalogRead } from "@/lib/data/server";
import { WomenCollection } from "./WomenCollection";

/**
 * Server shell: reads the catalogue, then hands it to the client component
 * that owns the fabric tabs. The fetch stays on the server so the collection
 * renders with its pieces already in the HTML rather than after a round trip.
 */
export default async function WomenPage() {
  return <WomenCollection products={await catalogRead.list()} />;
}
