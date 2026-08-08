-- FUJRS — the CONTRACT half of migration 18. See SCHEMA.md §2a.
--
-- DO NOT PUSH THIS UNTIL THE APP HAS BEEN RUNNING ON THE ID COLUMNS.
--
-- Migration 18 deliberately only added: it created the taxonomy tables, added
-- `category_id`/`fabric_id`/`color_id`/`badge_id` and the structured meterage
-- and dupatta columns, backfilled them, and left the old free-text columns in
-- place. That made the deploy reversible — if anything had gone wrong, rolling
-- the app back to the previous build would still have found its data.
--
-- This migration removes the old columns. It is the point of no return, so it
-- is a separate file you push on purpose rather than a tail end of 18 that goes
-- out before anyone has published a single product through the new form.
--
-- BEFORE PUSHING, CONFIRM ALL THREE:
--
--   1. A product has been published through the dashboard since 18 was applied,
--      and the storefront renders it correctly — category, fabric, colour
--      swatch, sizes, embroidery and the specs panel.
--
--   2. Nothing reads the legacy columns any more:
--        grep -rn "row.fabric\|row.category\|row.color\|dupatta_info" src/
--      should return nothing outside `src/lib/data/local/` (which normalises
--      old localStorage rows, not database rows, and is unaffected).
--
--   3. These are all zero:
--        select count(*) from products where category_id is null;
--        select count(*) from products where fabric_id is null;
--        select count(*) from products where color_id is null;
--
-- There is no down migration. Restore from a backup if this turns out wrong —
-- which is exactly why 18 and 19 are separate.

-- The indexes from migration 2 are on the columns being dropped. Postgres drops
-- them with the columns, but naming them here means the intent is recorded
-- rather than discovered later by someone wondering where they went.
drop index if exists products_category_gender_idx;
drop index if exists products_fabric_idx;

alter table products
  drop column category,
  drop column fabric,
  drop column color,
  drop column badge,
  drop column embroidery,
  drop column dupatta_info,
  drop column meters;

-- Replaces products_category_gender_idx, which covered the same access pattern
-- (a gendered collection page) on the text column.
create index products_category_id_gender_idx
  on products (category_id, gender) where archived_at is null;
