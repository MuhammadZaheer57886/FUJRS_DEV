// Saved product slugs. Extracted from WishlistContext.

import type { WishlistStore } from "../ports";
import { readJSON, writeJSON } from "./storage";

const KEY = "fujrs-wishlist";

export const localWishlist: WishlistStore = {
  async read() {
    const slugs = readJSON<string[]>(KEY, []);
    return Array.isArray(slugs) ? slugs : [];
  },

  async write(slugs) {
    writeJSON(KEY, slugs);
  },
};
