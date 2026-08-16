// Shared row → domain translation for the catalogue.
//
// Deliberately free of a `"use client"` directive and of any client/server
// client import: the browser adapter and the server read path both need this
// mapping, and duplicating it is how the two would drift.

import { SUPABASE_URL } from "./env";
import type { ColorFamily } from "@/lib/productTaxonomy";
import type { CatalogItem, ProductGender } from "../types";
import { clampFocal } from "@/lib/productPhoto";

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
 *
 * Colour comes through `product_colors` rather than `products.color_id`: a
 * piece is offered in several colourways (migration 21), and the legacy column
 * only ever held the first of them.
 */
export const PRODUCT_SELECT = `
  id, slug, title, description, price_paisa, compare_at_paisa, gender,
  sku, stock, is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, fabric_weight_gsm, meters_length, meters_note,
  dupatta_length, dupatta_finish, rating, review_count, created_at, created_by,
  category:product_categories!products_category_id_fkey ( id, label ),
  fabric:fabrics!products_fabric_id_fkey ( id, label ),
  product_colors ( position, colors ( id, label, hex, family ) ),
  badge:badges!products_badge_id_fkey ( id, label ),
  size_scale:size_scales!products_size_scale_id_fkey ( id ),
  dupatta_fabric:fabrics!products_dupatta_fabric_id_fkey ( id, label ),
  product_embroidery ( embroidery_techniques ( id, label, position ) ),
  product_images ( id, storage_path, position, focal_x, focal_y ),
  author:users!products_created_by_fkey ( name, email ),
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
  author: { name: string | null; email: string | null } | null;
  category: LabelRef | null;
  fabric: LabelRef | null;
  product_colors:
    { position: number; colors: (LabelRef & { hex: string; family: ColorFamily }) | null }[] | null;
  badge: LabelRef | null;
  size_scale: { id: string } | null;
  dupatta_fabric: LabelRef | null;
  product_embroidery:
    { embroidery_techniques: { id: string; label: string; position: number } | null }[] | null;
  product_images:
    | { id: string; storage_path: string; position: number; focal_x: number; focal_y: number }[]
    | null;
  product_variants: { size: string }[] | null;
}

export function toCatalogItem(row: ProductRow): CatalogItem {
  // Ordered by position — index 0 is the primary image. The focal point rides
  // along so every tile shape crops around the same spot (see ProductPhoto).
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      url: toPublicUrl(image.storage_path),
      focalX: clampFocal(image.focal_x),
      focalY: clampFocal(image.focal_y),
    }));

  // The junction returns rows in no particular order; sort by the technique's
  // own position so two products list the same techniques the same way.
  const embroidery = (row.product_embroidery ?? [])
    .map((link) => link.embroidery_techniques)
    .filter((technique): technique is { id: string; label: string; position: number } =>
      Boolean(technique)
    )
    .sort((a, b) => a.position - b.position)
    .map((technique) => technique.label);

  // Ordered by the position stored on the junction — index 0 is the primary
  // colour, which is the one a listing tile shows beside the title.
  const colors = [...(row.product_colors ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((link) => link.colors)
    .filter((color): color is LabelRef & { hex: string; family: ColorFamily } => Boolean(color))
    .map(({ id, label, hex, family }) => ({ id, label, hex, family }));

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
    colors,
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
    // Null in two ordinary cases, so neither is treated as an error: a seeded
    // product was created by nobody, and a shopper reading the storefront can
    // only see their own `users` row, so the join returns nothing for them.
    // Nothing on the shop renders these; the dashboard is the only reader.
    addedByEmail: row.author?.email ?? "",
    // Falls back to the email because `users.name` is nullable: a staff member
    // who has not set one should still be identifiable, not anonymous.
    addedByName: row.author?.name || row.author?.email || "-",
    createdAt: row.created_at,
  };
}
