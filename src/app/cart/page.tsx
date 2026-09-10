import { catalogRead } from "@/lib/data/server";
import { CartView } from "./CartView";

export { dynamic } from "@/lib/catalogRendering";

/** Server shell — the bag itself is browser state, the catalogue is not. */
export default async function CartPage() {
  return <CartView products={await catalogRead.list()} />;
}
