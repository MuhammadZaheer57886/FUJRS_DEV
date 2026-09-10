// Shop catalogue pages must render per request.
//
// A statically prerendered /women (or Home, /men, a product page) freezes the
// list at deploy. The dashboard writes live to Supabase, so Admin shows a new
// piece while the shop still serves the old HTML. Re-export `dynamic` from
// every new collection page:
//
//   export { dynamic } from "@/lib/catalogRendering";
//
// `supabaseCatalogServer` also calls `noStore()`, so a page that forgets the
// export still cannot be cached.

export const dynamic = "force-dynamic";
