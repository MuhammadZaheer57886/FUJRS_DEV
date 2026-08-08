// The taxonomy as it ships, mirroring the seed block in migration 18.
//
// It exists twice on purpose, and the two copies are NOT redundant: the SQL
// seeds the database, and this seeds the `local` backend, which has no
// database at all. Keeping them identical is what makes the demo and a freshly
// migrated project show the same lists — the same reason `static/catalog.ts`
// and `supabase/seed.sql` both derive from `src/data/products.ts`.
//
// If you change one, change the other. The slugs are the join between them.

import type {
  CategoryOption,
  ColorOption,
  ProductTaxonomy,
  SizeScaleOption,
  TaxonomyOption,
} from "../types";

const option = (slug: string, label: string): TaxonomyOption => ({
  id: slug,
  slug,
  label,
  archived: false,
});

export const SIZE_SCALES: SizeScaleOption[] = [
  { ...option("unstitched", "Unstitched"), values: ["Unstitched"] },
  { ...option("one-size", "One Size"), values: ["One Size"] },
  { ...option("alpha", "Alpha"), values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { ...option("shoe-eu", "Shoe (EU)"), values: ["36", "37", "38", "39", "40", "41", "42"] },
  {
    ...option("collar", "Collar"),
    values: ["14", "14.5", "15", "15.5", "16", "16.5", "17"],
  },
];

export const CATEGORIES: CategoryOption[] = [
  {
    ...option("3-piece-suits", "3-Piece Suits"),
    gender: "Women",
    defaultStitchingAddOn: 6500,
    defaultSizeScaleId: "unstitched",
    defaultMeters: 4.5,
    hasDupatta: true,
  },
  {
    ...option("2-piece-suits", "2-Piece Suits"),
    gender: "Women",
    defaultStitchingAddOn: 5500,
    defaultSizeScaleId: "unstitched",
    defaultMeters: 4,
    hasDupatta: false,
  },
  {
    ...option("kurta-fabric", "Kurta Fabric"),
    gender: "Men",
    defaultStitchingAddOn: 4500,
    defaultSizeScaleId: "unstitched",
    defaultMeters: 4.5,
    hasDupatta: false,
  },
  {
    ...option("formal-suiting", "Formal Suiting"),
    gender: "Men",
    defaultStitchingAddOn: 7500,
    defaultSizeScaleId: "unstitched",
    defaultMeters: 4.5,
    hasDupatta: false,
  },
  {
    ...option("jewelry", "Jewelry"),
    gender: "Women",
    defaultStitchingAddOn: null,
    defaultSizeScaleId: "one-size",
    defaultMeters: null,
    hasDupatta: false,
  },
  {
    ...option("accessories", "Accessories"),
    gender: null,
    defaultStitchingAddOn: null,
    defaultSizeScaleId: "one-size",
    defaultMeters: null,
    hasDupatta: false,
  },
  {
    ...option("footwear", "Footwear"),
    gender: null,
    defaultStitchingAddOn: null,
    defaultSizeScaleId: "shoe-eu",
    defaultMeters: null,
    hasDupatta: false,
  },
];

export const FABRICS: TaxonomyOption[] = [
  option("lawn", "Lawn"),
  option("cotton", "Cotton"),
  option("egyptian-cotton", "Egyptian Cotton"),
  option("latha", "Latha"),
  option("karandi", "Karandi"),
  option("wash-and-wear", "Wash & Wear"),
  option("silk", "Silk"),
  option("raw-silk", "Raw Silk"),
  option("chiffon", "Chiffon"),
  option("organza", "Organza"),
  option("net", "Net"),
  option("velvet", "Velvet"),
  option("pashmina-wool", "Pashmina Wool"),
  option("leather-and-zardozi", "Leather & Zardozi"),
  option("gold-plated-metal-pearl", "Gold-Plated Metal & Pearl"),
];

/**
 * Label and family deliberately disagree for the marketing names: "Emerald" is
 * GREEN, "Signature White" is WHITE. That disagreement is the whole point —
 * the page shows the label, the filter groups on the family.
 */
export const COLORS: ColorOption[] = [
  { ...option("black", "Black"), hex: "#111111", family: "BLACK" },
  { ...option("signature-white", "Signature White"), hex: "#ffffff", family: "WHITE" },
  { ...option("off-white", "Off-White"), hex: "#f5f2ea", family: "WHITE" },
  { ...option("ivory", "Ivory"), hex: "#fffff0", family: "CREAM" },
  { ...option("cream", "Cream"), hex: "#f3e9d2", family: "CREAM" },
  { ...option("slate-gray", "Slate Gray"), hex: "#708090", family: "GREY" },
  { ...option("blush", "Blush"), hex: "#e8c4c0", family: "PINK" },
  { ...option("emerald", "Emerald"), hex: "#0b6e4f", family: "GREEN" },
  { ...option("forest-green", "Forest Green"), hex: "#1b4332", family: "GREEN" },
  { ...option("olive-green", "Olive Green"), hex: "#6b7a3a", family: "GREEN" },
  { ...option("deep-navy", "Deep Navy"), hex: "#1b2a4a", family: "BLUE" },
  { ...option("midnight-blue", "Midnight Blue"), hex: "#191970", family: "BLUE" },
  { ...option("pastel-blue", "Pastel Blue"), hex: "#aec6cf", family: "BLUE" },
  { ...option("gold", "Gold"), hex: "#c9a227", family: "GOLD" },
];

export const BADGES: TaxonomyOption[] = [
  option("sold-by-fujrs", "Sold by FUJRS"),
  option("best-seller", "Best Seller"),
  option("limited-edition", "Limited Edition"),
  option("premium-collection", "Premium Collection"),
  option("official-store", "Official Store"),
];

export const EMBROIDERY_TECHNIQUES: TaxonomyOption[] = [
  option("gold-tilla", "Gold Tilla"),
  option("tilla", "Tilla"),
  option("zardozi", "Zardozi"),
  option("resham", "Resham"),
  option("sequins", "Sequins"),
  option("mirror-work", "Mirror Work"),
  option("pearl-beadwork", "Pearl Beadwork"),
  option("chikankari", "Chikankari"),
  option("applique", "Appliqué"),
  option("block-print", "Block Print"),
];

export const STATIC_TAXONOMY: ProductTaxonomy = {
  categories: CATEGORIES,
  fabrics: FABRICS,
  colors: COLORS,
  badges: BADGES,
  sizeScales: SIZE_SCALES,
  embroideryTechniques: EMBROIDERY_TECHNIQUES,
};

/** Case-insensitive label lookup, for mapping the hand-authored catalogue. */
export function findByLabel<T extends TaxonomyOption>(list: T[], label: string): T | undefined {
  const wanted = label.trim().toLowerCase();
  return list.find((entry) => entry.label.toLowerCase() === wanted);
}
