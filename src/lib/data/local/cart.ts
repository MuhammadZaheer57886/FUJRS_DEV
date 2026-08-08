// The bag. Extracted from CartContext so the provider holds React state only
// and the storage swaps with every other store.

import type { CartStore } from "../ports";
import type { CartLine } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "fujrs-cart";

export const localCart: CartStore = {
  async read() {
    const lines = readJSON<CartLine[]>(KEY, []);
    return Array.isArray(lines) ? lines : [];
  },

  async write(lines) {
    writeJSON(KEY, lines);
  },
};
