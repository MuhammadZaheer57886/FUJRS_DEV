// Shared row → domain translation for the catalogue.
//
// Deliberately free of a `"use client"` directive and of any client/server
// client import: the browser adapter and the server read path both need this
// mapping, and duplicating it is how the two would drift.

import { SUPABASE_URL } from "./env";
import type { ColorFamily } from "@/lib/productTaxonomy";
import type { CatalogItem, ProductGender } from "../types";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/**
 * Every column the app reads, plus the joins the domain shape needs.
 *
 * The taxonomy columns are ids, but `CatalogItem` carries the LABEL as well —
 * so each one is embedded here and resolved in `toCatalogItem`. A component
 * never joins anything and never learns these are separate tables.
 *
 * `fabrics` is embedded TWICE (the fabric, and the dupatta's fabric), which is
 * why every embed names its foreign key explicitly: with two paths to the same
 * table PostgREST cannot guess which one is meant, and refuses the request
 * rather than picking one.
 */
export const PRODUCT_SELECT = `
  id, slug, title, description, price_paisa, compare_at_paisa, gender,
  sku, stock, is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, fabric_weight_gsm, meters_length, meters_note,
  dupatta_length, dupatta_finish, rating, review_count, created_at, created_by,
  category:product_categories!products_category_id_fkey ( id, label ),
  fabric:fabrics!products_fabric_id_fkey ( id, label ),
  color:colors!products_color_id_fkey ( id, label, hex, family ),
  badge:badges!products_badge_id_fkey ( id, label ),
  size_scale:size_scales!products_size_scale_id_fkey ( id ),
  dupatta_fabric:fabrics!products_dupatta_fabric_id_fkey ( id, label ),
  product_embroidery ( embroidery_techniques ( id, label, position ) ),
  product_images ( storage_path, position ),
  product_variants ( size )
`;

/** PKR in the app, integer paisa in the database (SCHEMA.md). */
export const toPaisa = (pkr: number) => Math.round(pkr * 100);
export const toPkr = (paisa: number) => paisa / 100;
export const toPaisaOrNull = (pkr: number | null) => (pkr === null ? null : toPaisa(pkr));
export const toPkrOrNull = (paisa: number | null) => (paisa === null ? null : toPkr(paisa));

/**
 * numeric columns arrive as a number over PostgREST, but a string is the
 * documented possibility for arbitrary-precision types — coerce rather than
 * trust it, since `meters` feeds a `toFixed` on the product page.
 */
const toNumberOrNull = (value: number | string | null) => (value === null ? null : Number(value));

/**
 * Rows hold a bucket path, but the seeded catalogue holds absolute URLs from
 * the old design-tool host — see the note atop supabase/seed.sql. Anything
 * starting with http(s) is used as-is; everything else is a bucket object.
 *
 * The URL is composed from the project URL rather than through
 * `storage.getPublicUrl()`, because that needs a client instance and this has
 * to run on the server as well. It is the same string either way.
 */
function toPublicUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${storagePath}`;
}

/** A `to-one` embed. PostgREST returns null when the foreign key is null. */
interface LabelRef {
  id: string;
  label: string;
}

/** The shape of `PRODUCT_SELECT`, before it becomes a domain object. */
export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_paisa: number;
  compare_at_paisa: number | null;
  gender: string;
  sku: string | null;
  stock: number;
  is_new_arrival: boolean;
  stitching_eligible: boolean;
  stitching_addon_paisa: number | null;
  heritage_story: string | null;
  fabric_weight_gsm: number | null;
  meters_length: number | string | null;
  meters_note: string | null;
  dupatta_length: number | string | null;
  dupatta_finish: string | null;
  rating: number | null;
  review_count: number;
  created_at: string;
  created_by: string | null;
  category: LabelRef | null;
  fabric: LabelRef | null;
  color: (LabelRef & { hex: string; family: ColorFamily }) | null;
  badge: LabelRef | null;
  size_scale: { id: string } | null;
  dupatta_fabric: LabelRef | null;
  product_embroidery:
    | { embroidery_techniques: { id: string; label: string; position: number } | null }[]
    | null;
  product_images: { storage_path: string; position: number }[] | null;
  product_variants: { size: string }[] | null;
}

/**
 * The colour shown when a row somehow has none.
 *
 * `products.color_id` is NOT NULL, so this is unreachable through the database.
 * It exists because the embed is typed as nullable and the domain field is not,
 * and a thrown error here would blank the whole shop over one bad row.
 */
const MISSING_COLOR = { label: "—", hex: "#808080", family: "MULTI" as ColorFamily };

export function toCatalogItem(row: ProductRow): CatalogItem {
  // Ordered by position — index 0 is the primary image.
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => toPublicUrl(image.storage_path));

  // The junction returns rows in no particular order; sort by the technique's
  // own position so two products list the same techniques the same way.
  const embroidery = (row.product_embroidery ?? [])
    .map((link) => link.embroidery_techniques)
    .filter((technique): technique is { id: string; label: string; position: number } =>
      Boolean(technique)
    )
    .sort((a, b) => a.position - b.position)
    .map((technique) => technique.label);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: toPkr(row.price_paisa),
    compareAtPrice: toPkrOrNull(row.compare_at_paisa),
    fabric: row.fabric?.label ?? "",
    fabricId: row.fabric?.id ?? "",
    fabricWeightGsm: row.fabric_weight_gsm,
    category: row.category?.label ?? "",
    categoryId: row.category?.id ?? "",
    gender: row.gender as ProductGender,
    color: row.color?.label ?? MISSING_COLOR.label,
    colorId: row.color?.id ?? "",
    colorHex: row.color?.hex ?? MISSING_COLOR.hex,
    colorFamily: row.color?.family ?? MISSING_COLOR.family,
    sizes: (row.product_variants ?? []).map((variant) => variant.size),
    sizeScaleId: row.size_scale?.id ?? null,
    stock: row.stock,
    sku: row.sku,
    description: row.description,
    isNewArrival: row.is_new_arrival,
    stitchingEligible: row.stitching_eligible,
    stitchingAddOn: toPkrOrNull(row.stitching_addon_paisa),
    badge: row.badge?.label ?? null,
    badgeId: row.badge?.id ?? null,
    meters: toNumberOrNull(row.meters_length),
    metersNote: row.meters_note,
    embroidery,
    dupattaLength: toNumberOrNull(row.dupatta_length),
    dupattaFabric: row.dupatta_fabric?.label ?? null,
    dupattaFabricId: row.dupatta_fabric?.id ?? null,
    dupattaFinish: row.dupatta_finish,
    heritageStory: row.heritage_story,
    images,
    rating: row.rating,
    reviewCount: row.review_count,
    // The row records WHO created it by id; resolving that to a name needs a
    // join the list view doesn't justify. Shown as "—" until something needs it.
    addedByEmail: row.created_by ?? "",
    addedByName: "—",
    createdAt: row.created_at,
  };
}
