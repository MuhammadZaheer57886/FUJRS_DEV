// Catalogue products added from the dashboard. Admins and Super Admins publish
// immediately — there is no review step, because no role submits products for
// approval.

import { slugify, uniqueSlug } from "@/lib/slug";
import { isColorFamily } from "@/lib/productTaxonomy";
import { CENTRE_FOCAL, clampFocal } from "@/lib/productPhoto";
import type { CatalogStore } from "../ports";
import { StoreWriteError } from "../types";
import type {
  CatalogItem,
  ColorOption,
  ProductColor,
  ProductFormPhoto,
  ProductGender,
  ProductInput,
  ProductPhoto,
  TaxonomyOption,
} from "../types";
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
 * The colourways on a stored row.
 *
 * Three shapes exist in the wild: rows written since colours went multiple
 * (`colors: [...]`), rows written when a product had exactly one managed colour
 * (`colorId`/`colorHex`/`colorFamily`), and rows older than the managed lists,
 * which have a typed-in name and nothing else. The last two become a one-colour
 * product rather than a colourless one.
 *
 * Neutral grey and MULTI are what an unclassified colour reads as, which is
 * what it is — better than guessing a hex from a name like "Emerald".
 */
function normaliseColors(row: Record<string, unknown>): ProductColor[] {
  const one = (value: Record<string, unknown>): ProductColor | null => {
    const label = str(value.label) || str(value.color);
    const id = str(value.id) || str(value.colorId);
    if (!label && !id) return null;
    const hex = str(value.hex) || str(value.colorHex) || "#808080";
    const family = str(value.family) || str(value.colorFamily);
    return { id, label, hex, family: isColorFamily(family) ? family : "MULTI" };
  };

  if (Array.isArray(row.colors)) {
    return (row.colors as unknown[])
      .filter(
        (color): color is Record<string, unknown> => typeof color === "object" && color !== null
      )
      .map(one)
      .filter((color): color is ProductColor => color !== null);
  }

  const legacy = one(row);
  return legacy ? [legacy] : [];
}

/**
 * The photos on a stored row.
 *
 * Three shapes exist in the wild: rows written since focal points arrived
 * (`images: [{ url, focalX, focalY }]`), rows written when a photo was just a
 * URL (`images: ["..."]`), and rows older than the gallery, which carry one
 * `image`. Every one becomes a centred photo rather than a missing one.
 */
function normalisePhotos(row: Record<string, unknown>): ProductPhoto[] {
  const centred = (url: string): ProductPhoto => ({
    id: makeId(),
    url,
    focalX: CENTRE_FOCAL,
    focalY: CENTRE_FOCAL,
  });

  if (Array.isArray(row.images)) {
    return (row.images as unknown[])
      .map((image): ProductPhoto | null => {
        if (typeof image === "string") return image ? centred(image) : null;
        if (typeof image !== "object" || image === null) return null;
        const photo = image as Record<string, unknown>;
        const url = str(photo.url);
        if (!url) return null;
        return {
          id: str(photo.id) || makeId(),
          url,
          focalX: clampFocal(photo.focalX),
          focalY: clampFocal(photo.focalY),
        };
      })
      .filter((photo): photo is ProductPhoto => photo !== null);
  }

  const single = str(row.image);
  return single ? [centred(single)] : [];
}

/**
 * Rows written before the review step was removed carry `submittedBy*` and a
 * status; rows written before the form captured the full product are missing
 * colour, sizes, stock and the product-page details. Normalising here keeps
 * every old shape out of the components — an old row reads as a product with
 * blanks, not as a crash.
 */
function normalise(row: Record<string, unknown>): CatalogItem {
  const gallery = normalisePhotos(row);

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
    colors: normaliseColors(row),
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
    addedByName: str(row.addedByName) || str(row.submittedByName) || "-",
    createdAt: str(row.createdAt, new Date(0).toISOString()),
  };
}

/**
 * A form photo as this adapter stores it.
 *
 * The dimensions the uploader measured matter to Storage, not to a data URL the
 * browser renders directly, so only the URL is kept. A photo already on the
 * product is kept exactly as it was: its id is what an edit used to say "this
 * one stays".
 */
function toStoredPhoto(photo: ProductFormPhoto): ProductPhoto {
  if (photo.kind === "stored") {
    const { id, url, focalX, focalY } = photo;
    return { id, url, focalX, focalY };
  }
  return { id: makeId(), url: photo.dataUrl, focalX: photo.focalX, focalY: photo.focalY };
}

const readAll = (): CatalogItem[] => readJSON<Record<string, unknown>[]>(KEY, []).map(normalise);

/**
 * Everything the form owns, resolved from ids to labels.
 *
 * The form submits taxonomy IDS and a CatalogItem carries the LABELS. On
 * Supabase a join resolves them; here that join is a lookup in the stored
 * lists, done ONCE at write time so reads stay a plain array read.
 *
 * Shared by create and update rather than typed twice, because a field added
 * to one and forgotten in the other is a field that silently refuses to be
 * edited.
 */
async function resolveInput(
  input: ProductInput
): Promise<
  Omit<
    CatalogItem,
    "id" | "slug" | "rating" | "reviewCount" | "addedByEmail" | "addedByName" | "createdAt"
  >
> {
  const taxonomy = await localProductTaxonomy.read();
  const find = <T extends TaxonomyOption>(list: T[], id: string | null) =>
    id ? list.find((entry) => entry.id === id) : undefined;

  return {
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
    // Order is the order they were picked; the first is the primary.
    colors: input.colorIds
      .map((id) => find(taxonomy.colors, id))
      .filter((color): color is ColorOption => Boolean(color))
      .map(({ id, label, hex, family }) => ({ id, label, hex, family })),
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
    dupattaFabric: find(taxonomy.fabrics, input.dupattaFabricId)?.label ?? null,
    dupattaFabricId: input.dupattaFabricId,
    dupattaFinish: input.dupattaFinish,
    heritageStory: input.heritageStory,

    images: input.images.map(toStoredPhoto),
  };
}

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

    const item: CatalogItem = {
      ...(await resolveInput(input)),
      id: makeId(),
      slug: uniqueSlug(
        input.title,
        existing.map((product) => product.slug)
      ),
      rating: null,
      reviewCount: 0,
      addedByEmail: normaliseEmail(author.email),
      addedByName: author.name,
      createdAt: new Date().toISOString(),
    };

    writeJSON(KEY, [...existing, item]);
    return item;
  },

  async update(id, input) {
    const existing = readAll();
    const current = existing.find((item) => item.id === id);
    if (!current) throw new StoreWriteError("That product no longer exists. Reload and try again.");

    // The slug, the authorship and the timestamp are the store's, and a
    // retitled piece keeps the address it was published at rather than
    // breaking every link already shared. Same rule as Supabase.
    const item: CatalogItem = {
      ...current,
      ...(await resolveInput(input)),
    };

    writeJSON(
      KEY,
      existing.map((entry) => (entry.id === id ? item : entry))
    );
    return item;
  },

  async remove(id) {
    writeJSON(
      KEY,
      readAll().filter((item) => item.id !== id)
    );
  },
};
