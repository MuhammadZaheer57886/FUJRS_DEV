// The static catalogue, presented through the same domain shape as the
// database one.
//
// `src/data/products.ts` is the hand-written source the app shipped with, and
// it stays the input to `scripts/generate-seed.mjs`. This file is the boundary
// translation for it — exactly like an adapter maps a database row — so the
// storefront reads `CatalogItem` and never learns that the `local` backend is
// serving a TypeScript array.
//
// No I/O, so it runs on the server and in the browser alike.

import { products } from "@/data/products";
import type { CatalogReadStore } from "../ports";
import type { CatalogItem } from "../types";
import { BADGES, CATEGORIES, COLORS, FABRICS, SIZE_SCALES, findByLabel } from "./taxonomy";
import { CENTRE_FOCAL } from "@/lib/productPhoto";

/**
 * Stock the static pieces are treated as carrying. The array has no stock
 * figures, and the seed uses the same number — keeping them equal is what
 * makes the `local` storefront and a freshly seeded database look identical.
 */
const ASSUMED_STOCK = 25;

/** Sorted newest-first by list order: the array is authored oldest-first. */
const items: CatalogItem[] = products
  .map((product): CatalogItem => {
    // Everything the static array leaves off is absent, not blank — the same
    // distinction the database columns make.
    const { compareAtPrice, sku, badge, meters, embroidery, dupattaInfo, heritageStory } = product;

    // The hand-authored array holds LABELS; a CatalogItem carries the id and
    // the swatch too. Resolving them against the same seed the migration uses
    // is this file's version of the join the Supabase adapter does — see the
    // note at the top about why this mapping exists at all.
    const category = findByLabel(CATEGORIES, product.category);
    const fabric = findByLabel(FABRICS, product.fabric);
    const color = findByLabel(COLORS, product.color);
    const badgeOption = badge ? findByLabel(BADGES, badge) : undefined;
    const scale = SIZE_SCALES.find((option) =>
      product.sizes.every((size) => option.values.includes(size))
    );

    // "Pure Raw Silk (80gm)" is one fabric plus a weight, not a third silk.
    const weightMatch = /(\d+)\s*gm/i.exec(product.fabric);
    const fabricWeightGsm = weightMatch ? Number(weightMatch[1]) : null;
    const fabricFallback = fabricWeightGsm
      ? findByLabel(
          FABRICS,
          product.fabric
            .replace(/\(\s*\d+\s*gm\s*\)/i, "")
            .replace(/^\s*pure\s+/i, "")
            .trim()
        )
      : undefined;
    const resolvedFabric = fabric ?? fabricFallback;

    // "4.5 Meters (Standard Suit)" was a number, a unit and a note in one
    // string. The unit is implied; the number is what sorts and filters.
    const metersMatch = meters ? /^\s*(\d+(?:\.\d+)?)/.exec(meters) : null;
    const metersNoteMatch = meters ? /\(([^)]*)\)/.exec(meters) : null;

    // "2.5 Meters Organza with Border" was three fields.
    const dupattaMatch = dupattaInfo ? /^\s*(\d+(?:\.\d+)?)/.exec(dupattaInfo) : null;
    const dupattaFabric = dupattaInfo
      ? [...FABRICS]
          .sort((a, b) => b.label.length - a.label.length)
          .find((option) => dupattaInfo.toLowerCase().includes(option.label.toLowerCase()))
      : undefined;
    const dupattaFinish = dupattaInfo
      ? dupattaInfo
          .replace(/^\s*\d+(\.\d+)?\s*meters?\s*/i, "")
          .replace(dupattaFabric?.label ?? "", "")
          .trim() || null
      : null;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      compareAtPrice: compareAtPrice ?? null,
      fabric: resolvedFabric?.label ?? product.fabric,
      fabricId: resolvedFabric?.id ?? "",
      fabricWeightGsm,
      category: category?.label ?? product.category,
      categoryId: category?.id ?? "",
      gender: product.gender,
      // The hand-written array gives a piece one colour; the domain shape holds
      // however many it is offered in, so this is a one-element list.
      colors: [
        {
          id: color?.id ?? "",
          label: color?.label ?? product.color,
          hex: color?.hex ?? "#808080",
          family: color?.family ?? "MULTI",
        },
      ],
      sizes: product.sizes,
      sizeScaleId: scale?.id ?? null,
      stock: ASSUMED_STOCK,
      sku: sku ?? null,
      description: product.description,
      isNewArrival: product.isNewArrival,
      // A piece is stitchable exactly when it carries a charge — the same rule
      // the seed generator applies.
      stitchingEligible: product.stitchingAddOn != null,
      stitchingAddOn: product.stitchingAddOn ?? null,
      badge: badgeOption?.label ?? badge ?? null,
      badgeId: badgeOption?.id ?? null,
      meters: metersMatch ? Number(metersMatch[1]) : null,
      metersNote: metersNoteMatch ? metersNoteMatch[1].trim() : null,
      embroidery: (embroidery ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      dupattaLength: dupattaMatch ? Number(dupattaMatch[1]) : null,
      dupattaFabric: dupattaFabric?.label ?? null,
      dupattaFabricId: dupattaFabric?.id ?? null,
      dupattaFinish,
      heritageStory: heritageStory ?? null,
      // Seed photography has no focal point of its own, so it crops centred,
      // exactly as it did before focal points existed.
      images: product.images.map((url, i) => ({
        // No rows behind these, so the id is only ever a React key. Derived
        // from the slug so it is stable across reloads.
        id: `${product.slug}-photo-${i}`,
        url,
        focalX: CENTRE_FOCAL,
        focalY: CENTRE_FOCAL,
      })),
      // No rating until somebody reviews it. The static array used to carry
      // figures invented by the design tool, which contradicted the reviews
      // section on the very same page.
      rating: null,
      reviewCount: 0,
      addedByEmail: "",
      addedByName: "FUJRS",
      createdAt: new Date(0).toISOString(),
    };
  })
  .reverse();

export const staticCatalog: CatalogReadStore = {
  async list() {
    return items;
  },
  async getBySlug(slug) {
    return items.find((item) => item.slug === slug) ?? null;
  },
};
