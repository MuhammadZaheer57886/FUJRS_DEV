import "server-only";

// Catalogue reads for server components: the shop pages and the product page.
//
// Same tables and same row → domain mapping as the browser adapter; only the
// client differs. Products are public (`products_public_read`), so this uses
// the cookie-less public client. `noStore()` keeps the list from being frozen
// into the HTML at deploy; a new piece must show on /women without a rebuild.

import { unstable_noStore as noStore } from "next/cache";
import type { CatalogReadStore } from "../ports";
import { StoreWriteError } from "../types";
import { PRODUCT_SELECT, toCatalogItem, type ProductRow } from "./catalogRow";
import { createPublicSupabase } from "./server";

export const supabaseCatalogServer: CatalogReadStore = {
  async list() {
    noStore();
    const supabase = await createPublicSupabase();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load the catalogue.");

    return (data as unknown as ProductRow[] | null)?.map(toCatalogItem) ?? [];
  },

  async getBySlug(slug) {
    noStore();
    const supabase = await createPublicSupabase();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw new StoreWriteError("Couldn't load that product.");

    return data ? toCatalogItem(data as unknown as ProductRow) : null;
  },
};
