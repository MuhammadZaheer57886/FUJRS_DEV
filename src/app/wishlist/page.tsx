import { catalogRead } from "@/lib/data/server";
import { WishlistGrid } from "./WishlistGrid";

/** Server shell — the saved slugs are browser state, the catalogue is not. */
export default async function WishlistPage() {
  return <WishlistGrid products={await catalogRead.list()} />;
}
