-- FUJRS — a product comes in more than one colour.
--
-- Migration 18 gave every product exactly one `color_id`, because the form
-- offered exactly one swatch. That is wrong for how the catalogue is actually
-- bought: a piece is cut in three colourways off the same pattern, and the only
-- ways to express that were to publish it three times (three SKUs, three sets
-- of photos, three stock counts to keep straight) or to lose the other two.
--
-- SHAPE: the same junction the embroidery techniques use, plus a `position`.
-- Position matters here and does not there — the first colour is the one a
-- listing tile shows next to the title, so it has to be the one the person
-- publishing the product picked first, not whatever order Postgres returns.
--
-- `colors` itself is unchanged: label for the product page, family for the
-- filter axis. A product now contributes a facet per colour, so a red-and-blue
-- piece shows up under both.
--
-- EXPAND ONLY, like 18 was. `products.color_id` stays and stays populated with
-- the first colour, so rolling the app back to the previous build still finds
-- its data. A later migration drops it, once the checks at the bottom pass.

create table product_colors (
  product_id uuid not null references products(id) on delete cascade,
  color_id   uuid not null references colors(id) on delete restrict,

  -- Display order. 0 is the primary: the swatch on the listing tile and the
  -- colour a search matches first.
  position   integer not null default 0,

  primary key (product_id, color_id)
);

comment on table product_colors is
  'Every colourway a product is offered in. Ordered by position; 0 is primary.';
comment on column product_colors.position is
  'Display order. The row at 0 is what a listing tile renders.';

-- The storefront filter asks "which products are in this colour family", which
-- resolves to a lookup by color_id.
create index product_colors_color_idx on product_colors (color_id);

-- One product cannot list the same colour twice at two positions, and the
-- primary key already refuses a repeated colour. This refuses a repeated slot.
create unique index product_colors_position_idx
  on product_colors (product_id, position);

alter table product_colors enable row level security;

-- The junction follows the product, not the taxonomy: whoever may write the
-- product may say which colours it comes in. Same rule as product_embroidery.
create policy product_colors_public_read on product_colors for select using (true);
create policy product_colors_staff_write on product_colors
  for all using (is_staff()) with check (is_staff());

-- Backfill: every existing product keeps the colour it already had, as primary.
-- `products.color_id` is NOT NULL, so this covers the whole table.
insert into product_colors (product_id, color_id, position)
select id, color_id, 0 from products
on conflict do nothing;

comment on column products.color_id is
  'LEGACY - superseded by product_colors. Still written with the primary colour so a rollback finds data; nothing reads it. Dropped in a later migration.';

-- BEFORE WRITING THAT MIGRATION, CONFIRM BOTH:
--
--   1. Nothing reads the column:
--        grep -rn "color_id" src/
--      should only match the write in src/lib/data/supabase/catalog.ts.
--
--   2. Every product has at least one colourway:
--        select count(*) from products p where archived_at is null
--         and not exists (select 1 from product_colors c where c.product_id = p.id);
--      A product with no rows is not a database error - there is no constraint
--      that can express "at least one" without a deferred trigger - it renders
--      as a product with no colour, which the form does not allow you to make.
