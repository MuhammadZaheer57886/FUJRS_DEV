"use server";

import { revalidatePath } from "next/cache";

/**
 * Shop routes that embed the catalogue. A new collection page belongs here
 * so a publish can drop every snapshot in one call.
 */
const CATALOG_PATHS = [
  "/",
  "/women",
  "/men",
  "/new-arrivals",
  "/search",
  "/cart",
  "/wishlist",
] as const;

/**
 * Drop any cached shop HTML after a catalogue write.
 *
 * The shop also renders dynamically (`noStore` + `force-dynamic`). This is the
 * second lock: a CDN or a future ISR setting cannot keep a stale /women after
 * someone publishes, edits, or archives a piece. Direct SQL inserts still
 * appear on the next request because those pages are not static.
 */
export async function revalidateCatalog(): Promise<void> {
  try {
    for (const path of CATALOG_PATHS) {
      revalidatePath(path);
    }
    revalidatePath("/products", "layout");
    revalidatePath("/sitemap.xml");
  } catch (err) {
    // A publish must not fail because the cache drop did. The shop still
    // renders per request, so the next visit picks the new row up anyway.
    console.error("[revalidateCatalog]", err);
  }
}
