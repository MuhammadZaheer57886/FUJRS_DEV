-- FUJRS — catalogue. See SCHEMA.md §2.

create type product_gender as enum ('Women', 'Men', 'Unisex');

create table products (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null,
  description           text not null,

  price_paisa           bigint not null check (price_paisa >= 0),
  compare_at_paisa      bigint check (compare_at_paisa >= price_paisa),

  fabric                text not null,
  category              text not null,
  gender                product_gender not null,
  color                 text not null,
  sku                   text unique,
  stock                 integer not null default 0 check (stock >= 0),

  is_new_arrival        boolean not null default false,
  stitching_eligible    boolean not null default false,
  stitching_addon_paisa bigint check (stitching_addon_paisa >= 0),

  badge                 text,
  heritage_story        text,
  embroidery            text,
  dupatta_info          text,
  meters                text,

  -- Denormalised counters, recomputed from reviews when that table exists.
  -- Never maintained by hand.
  rating                numeric(2,1) check (rating between 0 and 5),
  review_count          integer not null default 0,

  created_by            uuid references users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Archive instead of deleting. Orders reference products; a hard delete
  -- would orphan order history. The admin "Remove" action sets this.
  archived_at           timestamptz
);

comment on column products.archived_at is
  'Soft delete. Orders reference products, so rows are never removed.';

create index products_category_gender_idx
  on products (category, gender) where archived_at is null;
create index products_fabric_idx
  on products (fabric) where archived_at is null;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
-- Separate table because a PDP shows several and order matters.
--
-- Files live in Supabase Storage (see the storage migration) — NOT as data
-- URLs. The browser build inlines base64 into localStorage and already hits
-- the ~5MB quota.

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  -- The object path inside the `product-images` bucket, e.g.
  -- "<product_id>/01-hero.webp" — NOT a full URL.
  --
  -- A public URL embeds the project ref
  -- (https://<ref>.supabase.co/storage/v1/object/public/...). Storing it would
  -- bake that ref into every row, so moving projects, putting a CDN in front,
  -- or leaving Supabase entirely would mean rewriting the whole table. The
  -- adapter builds the URL from this path via getPublicUrl(), which is one
  -- line and keeps the rows portable.
  storage_path text not null,

  alt        text,
  position   integer not null default 0,

  -- Intrinsic pixel dimensions, captured at upload.
  --
  -- next/image needs these to reserve space before the file loads. Without
  -- them the page reflows as each image arrives (cumulative layout shift),
  -- which is the single most visible way a product grid looks cheap.
  width      integer not null check (width > 0),
  height     integer not null check (height > 0),

  bytes      bigint check (bytes > 0),
  mime_type  text not null,

  -- Tiny base64 preview (~20-30 chars) for next/image placeholder="blur".
  -- Optional: null just means no blur-up.
  blur_data_url text,

  created_at timestamptz not null default now()
);

comment on column product_images.storage_path is
  'Path within the product-images bucket. Never a full URL — see the column comment.';
comment on column product_images.width is
  'Intrinsic width in px. Required by next/image to prevent layout shift.';

create index product_images_product_idx on product_images (product_id, position);

-- One image per product is the primary. Partial unique index rather than an
-- is_primary boolean plus application discipline, because "two primaries"
-- is exactly the bug that ships otherwise.
create unique index product_images_primary_idx
  on product_images (product_id) where position = 0;

-- Storefront product images are portrait 4:5 — the ratio 24 of the app's
-- image slots already use (aspect-[4/5]). Recommended source 1600x2000;
-- minimum 1200x1500, since the largest render is ~66vw on a wide screen.
--
-- Deliberately NOT a check constraint: a hard ratio rule would reject a
-- 1601x2000 upload for no real reason. The upload UI validates it with a
-- tolerance and tells the user what's wrong.

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
-- Per-size stock. If FUJRS never tracks stock per size, drop this table and
-- put a `sizes text[]` column on products instead — cheap now, awkward later.

create table product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size       text not null,
  stock      integer not null default 0 check (stock >= 0),
  sku        text unique,
  unique (product_id, size)
);
