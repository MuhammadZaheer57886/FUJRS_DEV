// Catalogue products added from the dashboard. Admins and Super Admins publish
// immediately — there is no review step, because no role submits products for
// approval.

import { slugify, uniqueSlug } from "@/lib/slug";
import { isColorFamily, type ColorFamily } from "@/lib/productTaxonomy";
import type { CatalogStore } from "../ports";
import type { CatalogItem, ProductGender, TaxonomyOption } from "../types";
import { makeId, normaliseEmail, readJSON, writeJSON } from "./storage";
import { localProductTaxonomy } from "./taxonomy";

const KEY = "fujrs-catalog";

/** What fabric is sold as, for rows written before sizes were captured. */
const DEFAULT_SIZES = ["Unstitched"];

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** "4.5 Meters (Standard Suit)" → 4.5. Null when there is no number to find. */
function parseLeadingNumber(value: unknown): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)/.exec(str(value));
  return match ? Number(match[1]) : null;
}

/**
 * Rows written before the review step was removed carry `submittedBy*` and a
 * status; rows written before the form captured the full product are missing
 * colour, sizes, stock and the product-page details. Normalising here keeps
 * every old shape out of the components — an old row reads as a product with
 * blanks, not as a crash.
 */
function normalise(row: Record<string, unknown>): CatalogItem {
  // Rows written before products supported more than one photo carry a single
  // `image`. Lifting it into the array here keeps the old shape out of every
  // component that reads a product.
  const gallery = Array.isArray(row.images)
    ? (row.images as unknown[]).filter((image): image is string => typeof image === "string")
    : typeof row.image === "string" && row.image
      ? [row.image]
      : [];

  const title = str(row.title);

  return {
    id: str(row.id, makeId()),
    slug: str(row.slug) || slugify(title),
    title,
    price: num(row.price) ?? 0,
    compareAtPrice: num(row.compareAtPrice),
    fabric: str(row.fabric),
    fabricId: str(row.fabricId),
    fabricWeightGsm: num(row.fabricWeightGsm),
    category: str(row.category),
    categoryId: str(row.categoryId),
    gender: str(row.gender, "Women") as ProductGender,
    color: str(row.color),
    colorId: str(row.colorId),
    // Rows written before colours were managed have no swatch to show. Neutral
    // grey and MULTI read as "unclassified", which is what they are — better
    // than guessing a hex from a name like "Emerald".
    colorHex: str(row.colorHex) || "#808080",
    colorFamily: isColorFamily(str(row.colorFamily)) ? (row.colorFamily as ColorFamily) : "MULTI",
    sizes: Array.isArray(row.sizes)
      ? (row.sizes as unknown[]).filter((size): size is string => typeof size === "string")
      : DEFAULT_SIZES,
    sizeScaleId: str(row.sizeScaleId) || null,
    stock: num(row.stock) ?? 0,
    sku: str(row.sku) || null,
    description: str(row.description),
    isNewArrival: row.isNewArrival === true,
    stitchingEligible: row.stitchingEligible === true,
    stitchingAddOn: num(row.stitchingAddOn),
    badge: str(row.badge) || null,
    badgeId: str(row.badgeId) || null,
    // `meters` was a string ("4.5 Meters") before it was a number. Parse rather
    // than discard, so an old row keeps its meterage instead of going blank.
    meters: num(row.meters) ?? parseLeadingNumber(row.meters),
    metersNote: str(row.metersNote) || null,
    embroidery: Array.isArray(row.embroidery)
      ? (row.embroidery as unknown[]).filter((v): v is string => typeof v === "string")
      : // Old rows held the CSV string "Gold Tilla, Zardozi, Sequins".
        str(row.embroidery)
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
    dupattaLength: num(row.dupattaLength) ?? parseLeadingNumber(row.dupattaInfo),
    dupattaFabric: str(row.dupattaFabric) || null,
    dupattaFabricId: str(row.dupattaFabricId) || null,
    // Old rows held it all in one string; keep it as the finish rather than
    // dropping the only description of the dupatta the row has.
    dupattaFinish: str(row.dupattaFinish) || str(row.dupattaInfo) || null,
    heritageStory: str(row.heritageStory) || null,
    images: gallery,
    // Reviews aren't built, so nothing has a rating yet. Null rather than 0 —
    // see the note on CatalogItem.rating.
    rating: num(row.rating),
    reviewCount: num(row.reviewCount) ?? 0,
    addedByEmail: str(row.addedByEmail) || str(row.submittedByEmail),
    addedByName: str(row.addedByName) || str(row.submittedByName) || "—",
    createdAt: str(row.createdAt, new Date(0).toISOString()),
  };
}

const readAll = (): CatalogItem[] => readJSON<Record<string, unknown>[]>(KEY, []).map(normalise);

export const localCatalog: CatalogStore = {
  async list() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getBySlug(slug) {
    return readAll().find((item) => item.slug === slug) ?? null;
  },

  // Throws StoreWriteError when the quota is hit — images are data URLs here,
  // so a large upload can exceed it. CatalogManager surfaces that to the user.
  async create(input, author) {
    const existing = readAll();

    // The form submits taxonomy IDS and a CatalogItem carries the LABELS. On
    // Supabase a join resolves them; here that join is a lookup in the stored
    // lists, done ONCE at write time so reads stay a plain array read.
    const taxonomy = await localProductTaxonomy.read();
    const find = <T extends TaxonomyOption>(list: T[], id: string | null) =>
      id ? list.find((entry) => entry.id === id) : undefined;

    const color = find(taxonomy.colors, input.colorId);
    const dupattaFabric = find(taxonomy.fabrics, input.dupattaFabricId);

    const item: CatalogItem = {
      id: makeId(),
      slug: uniqueSlug(
        input.title,
        existing.map((product) => product.slug)
      ),
      title: input.title,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      description: input.description,
      gender: input.gender,

      fabric: find(taxonomy.fabrics, input.fabricId)?.label ?? "",
      fabricId: input.fabricId,
      fabricWeightGsm: input.fabricWeightGsm,
      category: find(taxonomy.categories, input.categoryId)?.label ?? "",
      categoryId: input.categoryId,
      color: color?.label ?? "",
      colorId: input.colorId,
      colorHex: color?.hex ?? "#808080",
      colorFamily: color?.family ?? "MULTI",
      badge: find(taxonomy.badges, input.badgeId)?.label ?? null,
      badgeId: input.badgeId,

      sizes: input.sizes,
      sizeScaleId: input.sizeScaleId,
      stock: input.stock,
      sku: input.sku,
      isNewArrival: input.isNewArrival,
      stitchingEligible: input.stitchingEligible,
      stitchingAddOn: input.stitchingAddOn,

      meters: input.meters,
      metersNote: input.metersNote,
      embroidery: input.embroideryIds
        .map((id) => find(taxonomy.embroideryTechniques, id)?.label)
        .filter((label): label is string => Boolean(label)),
      dupattaLength: input.dupattaLength,
      dupattaFabric: dupattaFabric?.label ?? null,
      dupattaFabricId: input.dupattaFabricId,
      dupattaFinish: input.dupattaFinish,
      heritageStory: input.heritageStory,

      // The dimensions the uploader measured matter to Storage, not to a data
      // URL the browser renders directly — only the URL is kept here.
      images: input.images.map((image) => image.dataUrl),
      rating: null,
      reviewCount: 0,
      addedByEmail: normaliseEmail(author.email),
      addedByName: author.name,
      createdAt: new Date().toISOString(),
    };

    writeJSON(KEY, [...existing, item]);
    return item;
  },

  async remove(id) {
    writeJSON(
      KEY,
      readAll().filter((item) => item.id !== id)
    );
  },
};
