// Generates supabase/seed.sql from the static catalogue.
//
// NOT part of the normal flow. Products are created through the admin
// dashboard so that path stays exercised and honest. This exists only for a
// future bulk import of the real catalogue — run it deliberately, never as
// part of setup.
//
//   node --experimental-strip-types scripts/generate-seed.mjs
//
// Why generate rather than hand-write: src/data/products.ts stays the single
// source of truth for the catalogue while the app runs on the local adapter,
// so the seed can be regenerated whenever it changes instead of drifting.
//
// The output is idempotent — re-running it updates existing rows rather than
// duplicating them — so it is safe to apply more than once.

import { writeFileSync } from "node:fs";
import { products } from "../src/data/products.ts";
import {
  BADGES,
  CATEGORIES,
  COLORS,
  EMBROIDERY_TECHNIQUES,
  FABRICS,
  SIZE_SCALES,
} from "../src/lib/data/static/taxonomy.ts";

/** Single-quote escaping is the whole injection surface here. */
const q = (value) => (value == null ? "NULL" : `'${String(value).replace(/'/g, "''")}'`);
const n = (value) => (value == null ? "NULL" : String(value));

/** PKR in the app, integer paisa in the database (SCHEMA.md). */
const paisa = (pkr) => (pkr == null ? "NULL" : String(Math.round(pkr * 100)));

// --- Taxonomy ---------------------------------------------------------------
//
// The catalogue array holds LABELS; the products table references taxonomy rows
// by id. These turn one into the other the same way migration 18's backfill and
// src/lib/data/static/catalog.ts do — all three must agree, and the slug is
// what they agree on.

/**
 * Label -> slug, read from the shared seed rather than re-derived.
 *
 * Deriving it here with a slugify rule looked simpler and was wrong: the rule
 * turned "Gold-Plated Metal & Pearl" into `gold-plated-metal-and-pearl` while
 * the migration seeds `gold-plated-metal-pearl`, so the lookup returned NULL
 * for a NOT NULL column and the whole seed failed. Reading the actual pairs is
 * the only version that cannot drift.
 */
const slugIn = (list) => (label) => {
  if (label == null) return null;
  const wanted = String(label).trim().toLowerCase();
  const found = list.find((option) => option.label.toLowerCase() === wanted);
  if (!found) {
    throw new Error(
      `No taxonomy option matches "${label}". Add it to src/lib/data/static/taxonomy.ts and to the seed block in migration 18.`
    );
  }
  return found.slug;
};

const categorySlug = slugIn(CATEGORIES);
const fabricSlug = slugIn(FABRICS);
const colorSlug = slugIn(COLORS);
const badgeSlug = slugIn(BADGES);
const techniqueSlug = slugIn(EMBROIDERY_TECHNIQUES);

/** "Pure Raw Silk (80gm)" is one fabric plus a weight, not a third silk. */
function splitFabric(fabric) {
  const match = /(\d+)\s*gm/i.exec(fabric ?? "");
  if (!match) return { label: fabric, gsm: null };
  return {
    label: String(fabric)
      .replace(/\(\s*\d+\s*gm\s*\)/i, "")
      .replace(/^\s*pure\s+/i, "")
      .trim(),
    gsm: Number(match[1]),
  };
}

/** "4.5 Meters (Standard Suit)" -> 4.5 + "Standard Suit". */
function splitMeters(meters) {
  if (!meters) return { length: null, note: null };
  const length = /^\s*(\d+(?:\.\d+)?)/.exec(meters);
  const note = /\(([^)]*)\)/.exec(meters);
  return {
    length: length ? Number(length[1]) : null,
    note: note ? note[1].trim() : null,
  };
}

/** "2.5 Meters Organza with Border" -> 2.5 + Organza + "with Border". */
function splitDupatta(info) {
  if (!info) return { length: null, fabric: null, finish: null };
  const length = /^\s*(\d+(?:\.\d+)?)/.exec(info);
  // Longest label first so "Raw Silk" wins over "Silk" on the same string.
  const fabric = [...FABRICS]
    .sort((a, b) => b.label.length - a.label.length)
    .find((option) => info.toLowerCase().includes(option.label.toLowerCase()))?.label;

  const finish =
    info
      .replace(/^\s*\d+(\.\d+)?\s*meters?\s*/i, "")
      .replace(fabric ?? "", "")
      .trim() || null;

  return { length: length ? Number(length[1]) : null, fabric: fabric ?? null, finish };
}

/** "Gold Tilla, Zardozi, Sequins" -> three technique labels. */
const splitEmbroidery = (value) =>
  (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

/** The seeded scale whose values cover every size this product carries. */
const scaleFor = (sizes) =>
  !sizes?.length
    ? null
    : (SIZE_SCALES.find((scale) => sizes.every((size) => scale.values.includes(size)))?.slug ??
      null);

const GENDER = { Women: "Women", Men: "Men", Unisex: "Unisex" };

const lines = [
  "-- FUJRS catalogue seed — GENERATED, do not edit by hand.",
  "-- Regenerate: node --experimental-strip-types scripts/generate-seed.mjs",
  "--",
  "-- Idempotent: re-running updates rows rather than duplicating them.",
  "-- Product ids are derived from the slug so they are stable across runs.",
  "--",
  "-- KNOWN EXCEPTION: product_images.storage_path is documented as a bucket",
  "-- path, never a URL. These rows hold absolute lh3.googleusercontent.com",
  "-- URLs, because the current catalogue photography lives on a design-tool",
  "-- preview host and was never uploaded to the bucket. The adapter treats a",
  "-- value starting with http(s) as an absolute URL and anything else as a",
  "-- bucket path.",
  "--",
  "-- This is transitional. Those URLs already fail intermittently and will",
  "-- break for good; replacing them with real FUJRS photography in the",
  "-- product-images bucket is what removes this exception.",
  "",
  "begin;",
  "",
];

for (const p of products) {
  // A deterministic uuid from the slug keeps ids stable across re-seeds, so
  // cart_items and order_items don't end up pointing at replaced rows.
  const id = `md5(${q(p.slug)})::uuid`;

  // Taxonomy is referenced by id, and the ids are generated by the migration.
  // Rather than hard-code uuids that would change on every `db reset`, each one
  // is looked up by the SLUG the migration seeds — the stable key shared by the
  // migration, this script and src/lib/data/static/taxonomy.ts.
  const lookup = (table, slug) =>
    slug ? `(select id from ${table} where slug = ${q(slug)})` : "NULL";

  const fabric = splitFabric(p.fabric);
  const meters = splitMeters(p.meters);
  const dupatta = splitDupatta(p.dupattaInfo);

  lines.push(
    `insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  category_id, fabric_id, fabric_weight_gsm, gender, color_id, badge_id,
  size_scale_id, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  heritage_story, meters_length, meters_note,
  dupatta_length, dupatta_fabric_id, dupatta_finish,
  rating, review_count
) values (
  ${id}, ${q(p.slug)}, ${q(p.title)}, ${q(p.description)},
  ${paisa(p.price)}, ${paisa(p.compareAtPrice)},
  ${lookup("product_categories", categorySlug(p.category))},
  ${lookup("fabrics", fabricSlug(fabric.label))},
  ${fabric.gsm ?? "NULL"},
  ${q(GENDER[p.gender] ?? "Unisex")},
  ${lookup("colors", colorSlug(p.color))},
  ${lookup("badges", badgeSlug(p.badge))},
  ${lookup("size_scales", scaleFor(p.sizes))},
  ${q(p.sku)}, 25,
  ${p.isNewArrival ? "true" : "false"},
  ${p.stitchingAddOn != null ? "true" : "false"},
  ${paisa(p.stitchingAddOn)},
  ${q(p.heritageStory)}, ${meters.length ?? "NULL"}, ${q(meters.note)},
  ${dupatta.length ?? "NULL"},
  ${lookup("fabrics", fabricSlug(dupatta.fabric))},
  ${q(dupatta.finish)},
  NULL, 0
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  category_id = excluded.category_id,
  fabric_id = excluded.fabric_id,
  fabric_weight_gsm = excluded.fabric_weight_gsm,
  gender = excluded.gender,
  color_id = excluded.color_id,
  badge_id = excluded.badge_id,
  size_scale_id = excluded.size_scale_id,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  meters_length = excluded.meters_length,
  meters_note = excluded.meters_note,
  dupatta_length = excluded.dupatta_length,
  dupatta_fabric_id = excluded.dupatta_fabric_id,
  dupatta_finish = excluded.dupatta_finish,
  updated_at = now();
`
  );

  // Embroidery is a junction now, not a CSV column.
  lines.push(`delete from product_embroidery where product_id = ${id};`);
  for (const technique of splitEmbroidery(p.embroidery)) {
    lines.push(
      `insert into product_embroidery (product_id, technique_id)
select ${id}, id from embroidery_techniques where slug = ${q(techniqueSlug(technique))}
on conflict do nothing;`
    );
  }

  // Replace the image set wholesale — simpler and more predictable than
  // reconciling positions one by one.
  lines.push(`delete from product_images where product_id = ${id};`);

  p.images.forEach((url, index) => {
    lines.push(
      `insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (${id}, ${q(url)}, ${q(p.title)}, ${index}, 1600, 2000, 'image/jpeg');`
    );
  });

  if (p.sizes?.length) {
    lines.push(`delete from product_variants where product_id = ${id};`);
    for (const size of p.sizes) {
      lines.push(
        `insert into product_variants (product_id, size, stock) values (${id}, ${q(size)}, 10);`
      );
    }
  }

  lines.push("");
}

lines.push("commit;", "");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"));
console.log(`Wrote supabase/seed.sql — ${products.length} products.`);
