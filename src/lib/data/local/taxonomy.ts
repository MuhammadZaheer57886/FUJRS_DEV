// The managed product lists, in the browser.
//
// Starts from the same seed the database migration uses (`static/taxonomy.ts`)
// so the demo and a freshly migrated project offer identical options, then
// persists any change a Super Admin makes to localStorage.
//
// There is no permission check here. The `local` backend has no server to
// enforce one, which is exactly why it is the demo mode — the Supabase adapter
// gets its refusal from RLS.

import { slugify } from "@/lib/slug";
import type { ProductTaxonomyStore } from "../ports";
import { StoreWriteError } from "../types";
import type {
  CategoryOption,
  ColorOption,
  NewTaxonomyOption,
  ProductTaxonomy,
  SizeScaleOption,
  TaxonomyKind,
  TaxonomyOption,
} from "../types";
import { STATIC_TAXONOMY } from "../static/taxonomy";
import { makeId, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-product-taxonomy";

const KINDS: TaxonomyKind[] = [
  "categories",
  "fabrics",
  "colors",
  "badges",
  "sizeScales",
  "embroideryTechniques",
];

/**
 * Reads the stored lists, falling back to the seed per KIND rather than as a
 * whole. A browser that stored its lists before a new kind existed gets the
 * seed for that kind instead of an empty picker.
 */
function readAll(): ProductTaxonomy {
  const stored = readJSON<Partial<ProductTaxonomy>>(KEY, {});
  const taxonomy = {} as ProductTaxonomy;

  for (const kind of KINDS) {
    const list = stored[kind];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (taxonomy as any)[kind] =
      Array.isArray(list) && list.length > 0 ? list : STATIC_TAXONOMY[kind];
  }
  return taxonomy;
}

const save = (taxonomy: ProductTaxonomy) => {
  writeJSON(KEY, taxonomy);
  return taxonomy;
};

/** Case-insensitive duplicate check among the options still on offer. */
function assertNameFree(list: TaxonomyOption[], label: string, exceptId?: string) {
  const wanted = label.trim().toLowerCase();
  const clash = list.some(
    (entry) => !entry.archived && entry.id !== exceptId && entry.label.toLowerCase() === wanted
  );
  if (clash) throw new StoreWriteError("That name is already on the list.");
}

/** Builds the kind-specific option from the shared input shape. */
function build(kind: TaxonomyKind, input: NewTaxonomyOption): TaxonomyOption {
  const label = input.label.trim();
  const base: TaxonomyOption = {
    id: makeId(),
    slug: slugify(label) || makeId(),
    label,
    archived: false,
  };

  if (kind === "colors") {
    return { ...base, hex: input.hex ?? "#808080", family: input.family ?? "MULTI" } as ColorOption;
  }
  if (kind === "sizeScales") {
    return { ...base, values: input.values ?? [label] } as SizeScaleOption;
  }
  if (kind === "categories") {
    return {
      ...base,
      gender: input.gender ?? null,
      defaultStitchingAddOn: input.defaultStitchingAddOn ?? null,
      defaultSizeScaleId: input.defaultSizeScaleId ?? null,
      defaultMeters: input.defaultMeters ?? null,
      hasDupatta: input.hasDupatta ?? false,
    } as CategoryOption;
  }
  return base;
}

/** Replaces one list, leaving the other five untouched. */
function withList(
  taxonomy: ProductTaxonomy,
  kind: TaxonomyKind,
  list: TaxonomyOption[]
): ProductTaxonomy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...taxonomy, [kind]: list } as any;
}

export const localProductTaxonomy: ProductTaxonomyStore = {
  async read() {
    return readAll();
  },

  async add(kind, input) {
    if (!input.label.trim()) throw new StoreWriteError("Give the option a name.");

    const taxonomy = readAll();
    assertNameFree(taxonomy[kind], input.label);

    return save(withList(taxonomy, kind, [...taxonomy[kind], build(kind, input)]));
  },

  async setArchived(kind, id, archived) {
    const taxonomy = readAll();
    return save(
      withList(
        taxonomy,
        kind,
        taxonomy[kind].map((entry) => (entry.id === id ? { ...entry, archived } : entry))
      )
    );
  },

  async rename(kind, id, label) {
    const trimmed = label.trim();
    if (!trimmed) throw new StoreWriteError("Give the option a name.");

    const taxonomy = readAll();
    assertNameFree(taxonomy[kind], trimmed, id);

    return save(
      withList(
        taxonomy,
        kind,
        // The slug is the stable key the seed is joined on — the label moves,
        // the slug does not. Same rule as the Supabase adapter.
        taxonomy[kind].map((entry) => (entry.id === id ? { ...entry, label: trimmed } : entry))
      )
    );
  },
};
