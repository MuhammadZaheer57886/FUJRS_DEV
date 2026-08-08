import "server-only";

// The data entry point for SERVER components, alongside `@/lib/data` for the
// browser. Split for one reason: the `local` adapter is localStorage, which
// does not exist on the server, so a shop page rendered server-side needs a
// different source under each backend.
//
//   supabase → the products table
//   local    → the static catalogue in src/data/products.ts
//
// Both satisfy `CatalogReadStore`, so the pages are identical either way and
// still never learn which backend is running (BACKEND_SETUP.md §1).
//
// Pieces added from the dashboard therefore appear in the shop as soon as the
// backend is `supabase`. On `local` they stay in the browser that added them —
// the server has no way to see another visitor's localStorage, which is
// exactly why `local` is the demo mode.

import type { CatalogReadStore } from "./ports";
import { staticCatalog } from "./static/catalog";
import { supabaseCatalogServer } from "./supabase/catalog.server";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

export const catalogRead: CatalogReadStore =
  backend === "supabase" ? supabaseCatalogServer : staticCatalog;
