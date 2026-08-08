-- FUJRS — product taxonomy. See SCHEMA.md §2a.
--
-- WHY THIS EXISTS
--
-- `products.category`, `.fabric`, `.color`, `.badge` and `.embroidery` were
-- free text typed into the dashboard form, and the storefront builds its filter
-- facets by taking the distinct set of whatever was typed. Eighteen seeded
-- products already produce:
--
--   colour  Deep Navy / Midnight Blue / Pastel Blue  -> three facets, all blue
--   colour  Ivory / Cream / Off-White / Signature White -> four, all off-white
--   fabric  Silk / Raw Silk / Pure Raw Silk (80gm)   -> three, one fabric
--   badge   Official Store / Sold by FUJRS           -> two, one meaning
--
-- At a few hundred products the colour filter is unusable. The fix is the one
-- every apparel catalogue lands on: a managed list per taxonomy, referenced by
-- id, with the free-text column removed so a typo cannot create a facet.
--
-- SHAPE: one table per taxonomy, not a single `product_options (kind, ...)`
-- table. The one-true-lookup-table pattern forces every kind to share a column
-- set, and these do not share one — a colour carries a hex and a family, a
-- category carries the defaults a product inherits, a size scale carries an
-- ordered list of values. A shared table would make all of those nullable and
-- push the "which columns apply to this kind" rule into application code.
--
-- COLOUR: two fields, not one. `colors.label` is the marketing name shown on
-- the product page ("Midnight Blue"); `colors.family` is the fixed enum the
-- storefront filter facets on. Both blues above file under BLUE, so the facet
-- list stays sixteen rows no matter how many colours are added. Families are an
-- enum rather than a table on purpose: they are the filter axis, and an
-- editable axis drifts straight back to the problem this migration fixes.
--
-- EXPAND / CONTRACT: this migration only adds. The legacy text columns are
-- retained and marked LEGACY so the deploy is reversible and the seed script
-- keeps working; migration 19 drops them once the app is running on the ids.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- The filter axis. Sixteen families, chosen to cover this catalogue without
-- overlap; GOLD and SILVER earn their place in a market where tilla, zari and
-- zardozi are the point of the garment rather than a novelty.
create type color_family as enum (
  'BLACK', 'WHITE', 'CREAM', 'BEIGE', 'BROWN', 'GREY',
  'RED', 'PINK', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE',
  'GOLD', 'SILVER', 'MULTI'
);

-- ---------------------------------------------------------------------------
-- size_scales
-- ---------------------------------------------------------------------------
-- First, because product_categories points at it as a default.
--
-- A scale is an ORDERED list of sizes: unstitched fabric is sold as one, shoes
-- run 36-42, ready-to-wear runs XS-XXL. A product picks a scale and then ticks
-- which of its sizes it stocks (those become product_variants rows). Ordering
-- is the array's own order, which is why this is text[] and not a child table:
-- the values carry no attributes of their own, so a table would add a join to
-- express nothing.

create table size_scales (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  size_values text[] not null check (cardinality(size_values) > 0),
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column size_scales.size_values is
  'Ordered size labels. Order is display order — do not sort at read time.';

-- ---------------------------------------------------------------------------
-- product_categories
-- ---------------------------------------------------------------------------
-- The primary taxonomy, and the one that carries defaults.
--
-- The defaults are what actually shortens the product form: choosing
-- "3-Piece Suits" pre-fills the stitching charge, the size scale and the
-- meterage, and reveals the dupatta fields. Every default stays editable on the
-- product — this is a starting point, not a constraint, which is why none of
-- them are enforced against the product row.

create table product_categories (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  label    text not null,

  -- Null means "offered for every gender". Set, it scopes the category picker:
  -- a Men's product is never offered "3-Piece Suits".
  gender   product_gender,

  -- Defaults inherited by a new product in this category. All nullable —
  -- absent means "no default", not zero.
  default_stitching_addon_paisa bigint check (default_stitching_addon_paisa >= 0),
  default_size_scale_id         uuid references size_scales(id) on delete set null,
  default_meters                numeric(4,1) check (default_meters > 0),

  -- Whether the dupatta fields appear on the form at all. Footwear has no
  -- dupatta, and an always-visible field that never applies is how forms end up
  -- feeling like paperwork.
  has_dupatta boolean not null default false,

  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column product_categories.gender is
  'Null = offered for every gender. Otherwise scopes the category picker.';
comment on column product_categories.default_stitching_addon_paisa is
  'Pre-fills the product form. Never read at checkout — the product owns its own charge.';

-- ---------------------------------------------------------------------------
-- fabrics
-- ---------------------------------------------------------------------------
-- The base fabric only. Weight belongs on the product (`fabric_weight_gsm`),
-- which is what lets "Silk", "Raw Silk" and "Pure Raw Silk (80gm)" stop being
-- three separate filter facets.

create table fabrics (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- colors
-- ---------------------------------------------------------------------------

create table colors (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,
  label  text not null,

  -- Lower-case #rrggbb. Constrained rather than trusted: the swatch is rendered
  -- straight into a style attribute, and a malformed value there is a silently
  -- invisible swatch.
  hex    text not null check (hex ~ '^#[0-9a-f]{6}$'),

  family color_family not null,

  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column colors.label is
  'Marketing name shown on the product page, e.g. "Midnight Blue".';
comment on column colors.family is
  'The fixed axis the storefront filter groups on. Many labels share a family.';

create index colors_family_idx on colors (family) where archived_at is null;

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------

create table badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- embroidery_techniques + product_embroidery
-- ---------------------------------------------------------------------------
-- `products.embroidery` held "Gold Tilla, Zardozi, Sequins" — a multi-select
-- typed as CSV. A junction table makes it a real relation, so the product page
-- can render the techniques as separate items and they can be filtered on
-- later without parsing a string.

create table embroidery_techniques (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table product_embroidery (
  product_id   uuid not null references products(id) on delete cascade,
  technique_id uuid not null references embroidery_techniques(id) on delete restrict,
  primary key (product_id, technique_id)
);

create index product_embroidery_technique_idx on product_embroidery (technique_id);

-- ---------------------------------------------------------------------------
-- Shared constraints, indexes and triggers
-- ---------------------------------------------------------------------------
-- Case-insensitive uniqueness on the label among LIVE rows only. Archiving
-- "Emerald" and adding it back later is legitimate; two live "Emerald"s is the
-- duplicate-facet bug returning through a different door.

create unique index size_scales_label_idx
  on size_scales (lower(label)) where archived_at is null;
create unique index product_categories_label_idx
  on product_categories (lower(label)) where archived_at is null;
create unique index fabrics_label_idx
  on fabrics (lower(label)) where archived_at is null;
create unique index colors_label_idx
  on colors (lower(label)) where archived_at is null;
create unique index badges_label_idx
  on badges (lower(label)) where archived_at is null;
create unique index embroidery_techniques_label_idx
  on embroidery_techniques (lower(label)) where archived_at is null;

-- Every picker reads "live options in display order", so index that directly.
create index size_scales_live_idx on size_scales (position) where archived_at is null;
create index product_categories_live_idx on product_categories (position) where archived_at is null;
create index fabrics_live_idx on fabrics (position) where archived_at is null;
create index colors_live_idx on colors (position) where archived_at is null;
create index badges_live_idx on badges (position) where archived_at is null;
create index embroidery_techniques_live_idx on embroidery_techniques (position) where archived_at is null;

create trigger size_scales_set_updated_at before update on size_scales
  for each row execute function set_updated_at();
create trigger product_categories_set_updated_at before update on product_categories
  for each row execute function set_updated_at();
create trigger fabrics_set_updated_at before update on fabrics
  for each row execute function set_updated_at();
create trigger colors_set_updated_at before update on colors
  for each row execute function set_updated_at();
create trigger badges_set_updated_at before update on badges
  for each row execute function set_updated_at();
create trigger embroidery_techniques_set_updated_at before update on embroidery_techniques
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed the lists
-- ---------------------------------------------------------------------------
-- Seeded from the values already in the catalogue, so nothing breaks, plus the
-- obvious neighbours a staff member would otherwise have to add on day one.
--
-- ON CONFLICT DO NOTHING throughout: this migration must be replayable against
-- a database that has already been reset once.

insert into size_scales (slug, label, size_values, position) values
  ('unstitched', 'Unstitched', array['Unstitched'],                          0),
  ('one-size',   'One Size',   array['One Size'],                            1),
  ('alpha',      'Alpha',      array['XS','S','M','L','XL','XXL'],           2),
  ('shoe-eu',    'Shoe (EU)',  array['36','37','38','39','40','41','42'],    3),
  ('collar',     'Collar',     array['14','14.5','15','15.5','16','16.5','17'], 4)
on conflict (slug) do nothing;

insert into product_categories (slug, label, gender, default_stitching_addon_paisa, default_meters, has_dupatta, position) values
  ('3-piece-suits',  '3-Piece Suits',  'Women', 650000, 4.5, true,  0),
  ('2-piece-suits',  '2-Piece Suits',  'Women', 550000, 4.0, false, 1),
  ('kurta-fabric',   'Kurta Fabric',   'Men',   450000, 4.5, false, 2),
  ('formal-suiting', 'Formal Suiting', 'Men',   750000, 4.5, false, 3),
  ('jewelry',        'Jewelry',        'Women', null,   null, false, 4),
  ('accessories',    'Accessories',    null,    null,   null, false, 5),
  ('footwear',       'Footwear',       null,    null,   null, false, 6)
on conflict (slug) do nothing;

-- Default size scales, resolved by slug rather than hard-coded uuids.
update product_categories c
   set default_size_scale_id = s.id
  from size_scales s
 where c.default_size_scale_id is null
   and s.slug = case c.slug
                  when '3-piece-suits'  then 'unstitched'
                  when '2-piece-suits'  then 'unstitched'
                  when 'kurta-fabric'   then 'unstitched'
                  when 'formal-suiting' then 'unstitched'
                  when 'jewelry'        then 'one-size'
                  when 'accessories'    then 'one-size'
                  when 'footwear'       then 'shoe-eu'
                end;

insert into fabrics (slug, label, position) values
  ('lawn',                     'Lawn',                     0),
  ('cotton',                   'Cotton',                   1),
  ('egyptian-cotton',          'Egyptian Cotton',          2),
  ('latha',                    'Latha',                    3),
  ('karandi',                  'Karandi',                  4),
  ('wash-and-wear',            'Wash & Wear',              5),
  ('silk',                     'Silk',                     6),
  ('raw-silk',                 'Raw Silk',                 7),
  ('chiffon',                  'Chiffon',                  8),
  ('organza',                  'Organza',                  9),
  ('net',                      'Net',                     10),
  ('velvet',                   'Velvet',                  11),
  ('pashmina-wool',            'Pashmina Wool',           12),
  ('leather-and-zardozi',      'Leather & Zardozi',       13),
  ('gold-plated-metal-pearl',  'Gold-Plated Metal & Pearl', 14)
on conflict (slug) do nothing;

-- Hex values are the swatch. Where the catalogue's name is already a family
-- name ("Black", "Gold") the label and family agree; where it is a marketing
-- name ("Blush", "Emerald", "Signature White") they deliberately do not.
insert into colors (slug, label, hex, family, position) values
  ('black',           'Black',            '#111111', 'BLACK',  0),
  ('signature-white', 'Signature White',  '#ffffff', 'WHITE',  1),
  ('off-white',       'Off-White',        '#f5f2ea', 'WHITE',  2),
  ('ivory',           'Ivory',            '#fffff0', 'CREAM',  3),
  ('cream',           'Cream',            '#f3e9d2', 'CREAM',  4),
  ('slate-gray',      'Slate Gray',       '#708090', 'GREY',   5),
  ('blush',           'Blush',            '#e8c4c0', 'PINK',   6),
  ('emerald',         'Emerald',          '#0b6e4f', 'GREEN',  7),
  ('forest-green',    'Forest Green',     '#1b4332', 'GREEN',  8),
  ('olive-green',     'Olive Green',      '#6b7a3a', 'GREEN',  9),
  ('deep-navy',       'Deep Navy',        '#1b2a4a', 'BLUE',  10),
  ('midnight-blue',   'Midnight Blue',    '#191970', 'BLUE',  11),
  ('pastel-blue',     'Pastel Blue',      '#aec6cf', 'BLUE',  12),
  ('gold',            'Gold',             '#c9a227', 'GOLD',  13)
on conflict (slug) do nothing;

insert into badges (slug, label, position) values
  ('sold-by-fujrs',      'Sold by FUJRS',      0),
  ('best-seller',        'Best Seller',        1),
  ('limited-edition',    'Limited Edition',    2),
  ('premium-collection', 'Premium Collection', 3),
  -- Seeded only so the backfill below has something to point at. It means the
  -- same thing as "Sold by FUJRS"; archive one of the two from the dashboard.
  ('official-store',     'Official Store',     4)
on conflict (slug) do nothing;

insert into embroidery_techniques (slug, label, position) values
  ('gold-tilla',     'Gold Tilla',     0),
  ('tilla',          'Tilla',          1),
  ('zardozi',        'Zardozi',        2),
  ('resham',         'Resham',         3),
  ('sequins',        'Sequins',        4),
  ('mirror-work',    'Mirror Work',    5),
  ('pearl-beadwork', 'Pearl Beadwork', 6),
  ('chikankari',     'Chikankari',     7),
  ('applique',       'Appliqué',       8),
  ('block-print',    'Block Print',    9)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- products — new columns
-- ---------------------------------------------------------------------------
-- `on delete restrict` throughout: a taxonomy row in use must not be
-- deletable. The dashboard archives instead, which keeps published products
-- rendering their label while the option stops being offered.

alter table products
  add column category_id       uuid references product_categories(id) on delete restrict,
  add column fabric_id         uuid references fabrics(id) on delete restrict,
  add column color_id          uuid references colors(id) on delete restrict,
  add column badge_id          uuid references badges(id) on delete restrict,
  add column size_scale_id     uuid references size_scales(id) on delete restrict,

  -- Fabric weight, split out of the fabric name. Null when it does not apply
  -- (jewellery has no gsm).
  add column fabric_weight_gsm integer check (fabric_weight_gsm > 0),

  -- `meters` was "4.5 Meters (Standard Suit)" — a number, a unit and a note in
  -- one string. The unit is implied; the number sorts and filters.
  add column meters_length     numeric(4,1) check (meters_length > 0),
  add column meters_note       text,

  -- `dupatta_info` was "2.5 Meters Organza with Border" — three fields.
  add column dupatta_length    numeric(4,1) check (dupatta_length > 0),
  add column dupatta_fabric_id uuid references fabrics(id) on delete restrict,
  add column dupatta_finish    text;

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------
-- Matching on lower(btrim(label)): the existing rows hold display text typed
-- by hand, and the seeds above were written to match the tidy values exactly.
--
-- The messy ones are the point. The live database holds a product entered
-- through the dashboard as category "2 pice", fabric "raw silk", colour "blue" —
-- which is the bug this migration exists to stop, sitting in production. So the
-- backfill has to be LOSSLESS rather than assume the seeds cover everything: a
-- legacy value that matches nothing is ADOPTED as its own row rather than
-- dropped on the floor or hand-mapped in a migration nobody will read again.
--
-- Adopted rows are inserted ARCHIVED. The product keeps rendering its original
-- label, so no data is lost and no row silently changes meaning, but the value
-- is never offered in a picker again. A Super Admin sees them in the archived
-- list and can rename, restore or merge them. That also makes this migration
-- portable: it applies cleanly to the live database, to a fresh `db reset` with
-- the eighteen seeded products, and to anything typed between now and then.

-- Fabric weight first: "Pure Raw Silk (80gm)" becomes Raw Silk + 80. Before
-- adoption, or the parenthesised name gets adopted as a fabric of its own.
update products p
   set fabric_id = f.id,
       fabric_weight_gsm = nullif(substring(p.fabric from '(\d+)\s*gm'), '')::integer
  from fabrics f
 where p.fabric_id is null
   and p.fabric ~* '\(\s*\d+\s*gm\s*\)'
   and lower(f.label) = lower(btrim(regexp_replace(regexp_replace(p.fabric, '\(\s*\d+\s*gm\s*\)', '', 'gi'), '^\s*pure\s+', '', 'i')));

-- Adopt anything the seeds do not cover.
insert into product_categories (slug, label, position, archived_at)
select 'legacy-' || regexp_replace(lower(v.label), '[^a-z0-9]+', '-', 'g'), v.label, 900, now()
  from (select distinct btrim(category) as label from products
         where category_id is null and btrim(coalesce(category, '')) <> '') v
 where not exists (select 1 from product_categories c where lower(c.label) = lower(v.label))
on conflict (slug) do nothing;

insert into fabrics (slug, label, position, archived_at)
select 'legacy-' || regexp_replace(lower(v.label), '[^a-z0-9]+', '-', 'g'), v.label, 900, now()
  from (select distinct btrim(fabric) as label from products
         where fabric_id is null and btrim(coalesce(fabric, '')) <> '') v
 where not exists (select 1 from fabrics f where lower(f.label) = lower(v.label))
on conflict (slug) do nothing;

-- An adopted colour has no hex and no family to go on. It gets a neutral grey
-- swatch, and the family is guessed ONLY when the typed name is itself a family
-- name — "blue" resolves to BLUE, "2 pice" would not. Everything else lands in
-- MULTI, which reads as "unclassified" rather than pretending to know.
insert into colors (slug, label, hex, family, position, archived_at)
select 'legacy-' || regexp_replace(lower(v.label), '[^a-z0-9]+', '-', 'g'),
       v.label,
       '#808080',
       coalesce(
         (select f from unnest(enum_range(null::color_family)) f
           where lower(f::text) = lower(v.label)),
         'MULTI'::color_family
       ),
       900, now()
  from (select distinct btrim(color) as label from products
         where color_id is null and btrim(coalesce(color, '')) <> '') v
 where not exists (select 1 from colors c where lower(c.label) = lower(v.label))
on conflict (slug) do nothing;

insert into badges (slug, label, position, archived_at)
select 'legacy-' || regexp_replace(lower(v.label), '[^a-z0-9]+', '-', 'g'), v.label, 900, now()
  from (select distinct btrim(badge) as label from products
         where badge_id is null and btrim(coalesce(badge, '')) <> '') v
 where not exists (select 1 from badges b where lower(b.label) = lower(v.label))
on conflict (slug) do nothing;

insert into embroidery_techniques (slug, label, position, archived_at)
select 'legacy-' || regexp_replace(lower(v.label), '[^a-z0-9]+', '-', 'g'), v.label, 900, now()
  from (select distinct btrim(part.value) as label
          from products p
         cross join lateral unnest(string_to_array(p.embroidery, ',')) as part(value)
         where p.embroidery is not null and btrim(part.value) <> '') v
 where not exists (select 1 from embroidery_techniques t where lower(t.label) = lower(v.label))
on conflict (slug) do nothing;

-- Everything now has a row to point at.
update products p set category_id = c.id
  from product_categories c
 where lower(c.label) = lower(btrim(p.category)) and p.category_id is null;

update products p set fabric_id = f.id
  from fabrics f
 where lower(f.label) = lower(btrim(p.fabric)) and p.fabric_id is null;

update products p set color_id = c.id
  from colors c
 where lower(c.label) = lower(btrim(p.color)) and p.color_id is null;

update products p set badge_id = b.id
  from badges b
 where lower(b.label) = lower(btrim(p.badge)) and p.badge_id is null;

-- Size scale: whichever seeded scale contains every size this product already
-- has rows for. `@>` is array containment, so a product stocking only 38 and 39
-- still resolves to Shoe (EU) rather than failing to match.
update products p
   set size_scale_id = s.id
  from size_scales s
 where p.size_scale_id is null
   and s.size_values @> (
     select coalesce(array_agg(v.size), array[]::text[])
       from product_variants v where v.product_id = p.id
   )
   and exists (select 1 from product_variants v where v.product_id = p.id);

-- Meterage: leading number, then whatever is left inside the brackets.
update products
   set meters_length = nullif(substring(meters from '^\s*(\d+(?:\.\d+)?)'), '')::numeric,
       meters_note   = nullif(btrim(coalesce(substring(meters from '\(([^)]*)\)'), '')), '')
 where meters is not null and meters_length is null;

-- Dupatta: "2.5 Meters Organza with Border" -> 2.5 / Organza / "with Border".
update products
   set dupatta_length = nullif(substring(dupatta_info from '^\s*(\d+(?:\.\d+)?)'), '')::numeric
 where dupatta_info is not null and dupatta_length is null;

-- Literal containment, not a regex: an adopted label is arbitrary text a human
-- typed, and one containing "(" would make a regex built from it throw. Longest
-- match wins so "Raw Silk" beats "Silk" on the same string.
update products p
   set dupatta_fabric_id = (
     select f.id from fabrics f
      where strpos(lower(p.dupatta_info), lower(f.label)) > 0
      order by length(f.label) desc
      limit 1
   )
 where p.dupatta_info is not null and p.dupatta_fabric_id is null;

-- `replace` rather than `regexp_replace` for the same reason.
update products p
   set dupatta_finish = nullif(btrim(replace(
         regexp_replace(p.dupatta_info, '^\s*\d+(\.\d+)?\s*meters?\s*', '', 'i'),
         coalesce((select f.label from fabrics f where f.id = p.dupatta_fabric_id), '~never~'),
         '')), '')
 where p.dupatta_info is not null and p.dupatta_finish is null;

-- Embroidery CSV -> junction rows.
insert into product_embroidery (product_id, technique_id)
select p.id, t.id
  from products p
 cross join lateral unnest(string_to_array(p.embroidery, ',')) as part(value)
  join embroidery_techniques t on lower(t.label) = lower(btrim(part.value))
 where p.embroidery is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Constrain, now that the data is in place
-- ---------------------------------------------------------------------------
-- These three are NOT NULL because the storefront cannot render a product
-- without them: the PDP prints the fabric and colour, and every listing filters
-- on category. If this migration fails here, the backfill above missed a row —
-- find it with `select id, slug, category, fabric, color from products where
-- category_id is null or fabric_id is null or color_id is null;` rather than
-- relaxing the constraint.

alter table products
  alter column category_id set not null,
  alter column fabric_id   set not null,
  alter column color_id    set not null;

create index products_category_id_idx on products (category_id) where archived_at is null;
create index products_fabric_id_idx   on products (fabric_id)   where archived_at is null;
create index products_color_id_idx    on products (color_id)    where archived_at is null;

-- The legacy columns stay until migration 19 so this deploy is reversible.
-- Nothing may read them from here on: they are no longer maintained, and a
-- product created after this migration leaves them null.
comment on column products.category is
  'LEGACY — superseded by category_id. No longer written. Dropped in migration 19.';
comment on column products.fabric is
  'LEGACY — superseded by fabric_id + fabric_weight_gsm. Dropped in migration 19.';
comment on column products.color is
  'LEGACY — superseded by color_id. Dropped in migration 19.';
comment on column products.badge is
  'LEGACY — superseded by badge_id. Dropped in migration 19.';
comment on column products.embroidery is
  'LEGACY — superseded by product_embroidery. Dropped in migration 19.';
comment on column products.meters is
  'LEGACY — superseded by meters_length + meters_note. Dropped in migration 19.';
comment on column products.dupatta_info is
  'LEGACY — superseded by dupatta_length/dupatta_fabric_id/dupatta_finish. Dropped in migration 19.';

-- The legacy columns are NOT NULL from the original migration, which would
-- reject any product created after this one. Drop that requirement now; the
-- columns themselves go in 19.
alter table products
  alter column category drop not null,
  alter column fabric   drop not null,
  alter column color    drop not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Read the warning at the top of the RLS migration first. A table added later
-- starts with RLS DISABLED, which is wide open to the anon key.
--
-- Reads are unrestricted, INCLUDING archived rows. That is deliberate: a
-- published product may reference an archived colour, and a policy hiding it
-- would make the embedded join return null for a NOT NULL domain field. The
-- pickers filter `archived_at is null` in the adapter — archiving controls what
-- is OFFERED, not what is readable.
--
-- Writes are Super Admin only. Admins publish products; only a Super Admin
-- changes the lists those products choose from (REQUIREMENTS.md §4.1).

alter table size_scales           enable row level security;
alter table product_categories    enable row level security;
alter table fabrics               enable row level security;
alter table colors                enable row level security;
alter table badges                enable row level security;
alter table embroidery_techniques enable row level security;
alter table product_embroidery    enable row level security;

create policy size_scales_public_read on size_scales for select using (true);
create policy size_scales_super_admin_write on size_scales
  for all using (is_super_admin()) with check (is_super_admin());

create policy product_categories_public_read on product_categories for select using (true);
create policy product_categories_super_admin_write on product_categories
  for all using (is_super_admin()) with check (is_super_admin());

create policy fabrics_public_read on fabrics for select using (true);
create policy fabrics_super_admin_write on fabrics
  for all using (is_super_admin()) with check (is_super_admin());

create policy colors_public_read on colors for select using (true);
create policy colors_super_admin_write on colors
  for all using (is_super_admin()) with check (is_super_admin());

create policy badges_public_read on badges for select using (true);
create policy badges_super_admin_write on badges
  for all using (is_super_admin()) with check (is_super_admin());

create policy embroidery_techniques_public_read on embroidery_techniques for select using (true);
create policy embroidery_techniques_super_admin_write on embroidery_techniques
  for all using (is_super_admin()) with check (is_super_admin());

-- The junction follows the product, not the taxonomy: whoever may write the
-- product may say what is embroidered on it.
create policy product_embroidery_public_read on product_embroidery for select using (true);
create policy product_embroidery_staff_write on product_embroidery
  for all using (is_staff()) with check (is_staff());
