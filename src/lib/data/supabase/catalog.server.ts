import "server-only";

// Catalogue reads for server components — the shop pages and the product page.
//
// Same tables and same row → domain mapping as the browser adapter; only the
// client differs. Products are public (`products_public_read`), so this uses
// the cookie-less public client and the pages stay statically renderable.

import type { CatalogReadStore } from "../ports";
import { StoreWriteError } from "../types";
import { PRODUCT_SELECT, toCatalogItem, type ProductRow } from "./catalogRow";
import { createPublicSupabase } from "./server";

export const supabaseCatalogServer: CatalogReadStore = {
  async list() {
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
