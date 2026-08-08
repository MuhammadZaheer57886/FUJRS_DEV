"use client";

// The managed lists behind the product form, against the six lookup tables in
// migration 18.
//
// Writes are gated by RLS (`*_super_admin_write`), so a signed-in Super Admin
// succeeds and everyone else is refused by the database rather than by the UI
// hiding a button — the same arrangement as the catalogue.

import { slugify } from "@/lib/slug";
import type { ColorFamily } from "@/lib/productTaxonomy";
import type { ProductTaxonomyStore } from "../ports";
import { StoreWriteError } from "../types";
import type {
  CategoryOption,
  ColorOption,
  NewTaxonomyOption,
  ProductGender,
  ProductTaxonomy,
  SizeScaleOption,
  TaxonomyKind,
  TaxonomyOption,
} from "../types";
import { getBrowserClient } from "./client";
import { toPaisaOrNull, toPkrOrNull } from "./catalogRow";

/**
 * Domain name -> table. The only place the table names appear.
 *
 * `as const satisfies` rather than a plain `Record<TaxonomyKind, string>`: the
 * generated `Database` type only accepts known table names, so widening these
 * to `string` would lose the check that each one actually exists.
 */
const TABLES = {
  categories: "product_categories",
  fabrics: "fabrics",
  colors: "colors",
  badges: "badges",
  sizeScales: "size_scales",
  embroideryTechniques: "embroidery_techniques",
} as const satisfies Record<TaxonomyKind, string>;

type TaxonomyTable = (typeof TABLES)[TaxonomyKind];

/** Shared shape. `archived_at` is a timestamp; the domain only cares that it exists. */
interface BaseRow {
  id: string;
  slug: string;
  label: string;
  archived_at: string | null;
}

const BASE_COLUMNS = "id, slug, label, archived_at, position";

const toOption = (row: BaseRow): TaxonomyOption => ({
  id: row.id,
  slug: row.slug,
  label: row.label,
  archived: row.archived_at !== null,
});

function failed(error: { code?: string } | null, fallback: string): StoreWriteError {
  // 42501 is Postgres "insufficient privilege" — RLS said no. 23505 is the
  // unique violation on lower(label), i.e. that name is already on the list.
  if (error?.code === "42501") {
    return new StoreWriteError("Only a Super Admin can change these lists.");
  }
  if (error?.code === "23505") {
    return new StoreWriteError("That name is already on the list.");
  }
  return new StoreWriteError(fallback);
}

/**
 * Reads every list in one round trip.
 *
 * ARCHIVED ROWS ARE INCLUDED. A published product may reference an archived
 * option and still has to render its label; the pickers filter on `archived`.
 * Hiding them here would make an archived colour read as a missing colour.
 */
async function readAll(): Promise<ProductTaxonomy> {
  const supabase = getBrowserClient();
  const order = { column: "position", ascending: true } as const;

  const [categories, fabrics, colors, badges, sizeScales, techniques] = await Promise.all([
    supabase
      .from(TABLES.categories)
      .select(
        `${BASE_COLUMNS}, gender, default_stitching_addon_paisa, default_size_scale_id, default_meters, has_dupatta`
      )
      .order(order.column, { ascending: order.ascending }),
    supabase.from(TABLES.fabrics).select(BASE_COLUMNS).order(order.column, { ascending: true }),
    supabase
      .from(TABLES.colors)
      .select(`${BASE_COLUMNS}, hex, family`)
      .order(order.column, { ascending: true }),
    supabase.from(TABLES.badges).select(BASE_COLUMNS).order(order.column, { ascending: true }),
    supabase
      .from(TABLES.sizeScales)
      .select(`${BASE_COLUMNS}, size_values`)
      .order(order.column, { ascending: true }),
    supabase
      .from(TABLES.embroideryTechniques)
      .select(BASE_COLUMNS)
      .order(order.column, { ascending: true }),
  ]);

  const firstError =
    categories.error ??
    fabrics.error ??
    colors.error ??
    badges.error ??
    sizeScales.error ??
    techniques.error;
  if (firstError) throw new StoreWriteError("Couldn't load the product lists.");

  return {
    categories: ((categories.data ?? []) as unknown as (BaseRow & {
      gender: string | null;
      default_stitching_addon_paisa: number | null;
      default_size_scale_id: string | null;
      default_meters: number | null;
      has_dupatta: boolean;
    })[]).map(
      (row): CategoryOption => ({
        ...toOption(row),
        gender: (row.gender as ProductGender | null) ?? null,
        defaultStitchingAddOn: toPkrOrNull(row.default_stitching_addon_paisa),
        defaultSizeScaleId: row.default_size_scale_id,
        // numeric(4,1) arrives as a number over PostgREST, but a string is the
        // documented possibility for numerics — coerce rather than trust it.
        defaultMeters: row.default_meters === null ? null : Number(row.default_meters),
        hasDupatta: row.has_dupatta,
      })
    ),
    fabrics: ((fabrics.data ?? []) as unknown as BaseRow[]).map(toOption),
    colors: ((colors.data ?? []) as unknown as (BaseRow & {
      hex: string;
      family: ColorFamily;
    })[]).map((row): ColorOption => ({ ...toOption(row), hex: row.hex, family: row.family })),
    badges: ((badges.data ?? []) as unknown as BaseRow[]).map(toOption),
    sizeScales: ((sizeScales.data ?? []) as unknown as (BaseRow & { size_values: string[] })[]).map(
      (row): SizeScaleOption => ({ ...toOption(row), values: row.size_values ?? [] })
    ),
    embroideryTechniques: ((techniques.data ?? []) as unknown as BaseRow[]).map(toOption),
  };
}

/**
 * A slug that isn't taken yet.
 *
 * Archiving "Emerald" and adding it back later is legitimate, but `slug` is
 * unique across live AND archived rows, so the plain slugify would collide with
 * the archived one. Suffixes rather than fails.
 */
async function freeSlug(table: TaxonomyTable, label: string): Promise<string> {
  const base = slugify(label) || "option";
  const { data } = await getBrowserClient()
    .from(table)
    .select("slug")
    .like("slug", `${base}%`);

  const taken = new Set(((data ?? []) as { slug: string }[]).map((row) => row.slug));
  if (!taken.has(base)) return base;

  for (let n = 2; n < 1000; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
  throw new StoreWriteError("Couldn't find a free name for that option.");
}

/** New options sort after the seeded ones rather than jumping to the top. */
async function nextPosition(table: TaxonomyTable): Promise<number> {
  const { data } = await getBrowserClient()
    .from(table)
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { position: number } | null)?.position ?? -1) + 1;
}

/** The columns specific to each kind, built from the shared input shape. */
function extraColumns(kind: TaxonomyKind, input: NewTaxonomyOption): Record<string, unknown> {
  if (kind === "colors") {
    return { hex: input.hex, family: input.family };
  }
  if (kind === "sizeScales") {
    return { size_values: input.values };
  }
  if (kind === "categories") {
    return {
      gender: input.gender ?? null,
      default_stitching_addon_paisa: toPaisaOrNull(input.defaultStitchingAddOn ?? null),
      default_size_scale_id: input.defaultSizeScaleId ?? null,
      default_meters: input.defaultMeters ?? null,
      has_dupatta: input.hasDupatta ?? false,
    };
  }
  return {};
}

export const supabaseProductTaxonomy: ProductTaxonomyStore = {
  read: readAll,

  async add(kind, input) {
    const table = TABLES[kind];
    const label = input.label.trim();
    if (!label) throw new StoreWriteError("Give the option a name.");

    const [slug, position] = await Promise.all([freeSlug(table, label), nextPosition(table)]);

    const { error } = await getBrowserClient()
      .from(table)
      .insert({ slug, label, position, ...extraColumns(kind, input) });

    if (error) throw failed(error, "Couldn't add that option.");
    return readAll();
  },

  async setArchived(kind, id, archived) {
    const { error } = await getBrowserClient()
      .from(TABLES[kind])
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) throw failed(error, "Couldn't update that option.");
    return readAll();
  },

  async rename(kind, id, label) {
    const trimmed = label.trim();
    if (!trimmed) throw new StoreWriteError("Give the option a name.");

    // The slug deliberately does NOT change with the label: it is the stable
    // key this table is joined on from the seed and from `static/taxonomy.ts`.
    const { error } = await getBrowserClient()
      .from(TABLES[kind])
      .update({ label: trimmed })
      .eq("id", id);

    if (error) throw failed(error, "Couldn't rename that option.");
    return readAll();
  },
};
