-- FUJRS — cart and wishlist.
--
-- These live only in localStorage today (CartContext.tsx, WishlistContext.tsx)
-- and were missing from SCHEMA.md — an omission, not a deferral.
--
-- Anonymous auth is what makes them work properly: a guest gets a real uuid on
-- arrival, so their cart is a normal RLS-scoped row from the first click, and
-- it is still theirs after they register because the id never changes. No
-- merge step, no "you had items in your bag" reconciliation.

-- ---------------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------------
-- A cart is not a table — it is the set of rows a user owns. There is no
-- `carts` parent, because it would only ever hold a user_id.
--
-- The same product appears as two lines when one is plain and one is stitched
-- (CartContext keys lines by slug + stitched), so uniqueness is over
-- (user, product, variant, stitching_label) rather than product alone.

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,

  quantity   integer not null default 1 check (quantity > 0),

  -- Bespoke selection for this line, mirroring StitchingSelection.
  stitching_label       text,
  stitching_addon_paisa bigint check (stitching_addon_paisa >= 0),
  stitcher_slug         text,

  added_at   timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- coalesce so null stitching_label doesn't defeat the constraint: in SQL,
-- null <> null, so two plain lines for the same product would both be allowed.
create unique index cart_items_unique_line_idx
  on cart_items (
    user_id,
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(stitching_label, '')
  );

create index cart_items_user_idx on cart_items (user_id);

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

-- NOTE: prices are deliberately NOT stored here. A cart shows the CURRENT
-- price; only an order snapshots it. Storing a price on the cart line means a
-- customer can leave an item for a month and check out at last month's price.

-- ---------------------------------------------------------------------------
-- wishlist_items
-- ---------------------------------------------------------------------------

create table wishlist_items (
  user_id    uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlist_items_user_idx on wishlist_items (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Required: tables created after the rls migration start with security
-- DISABLED, and these hold per-user data.
--
-- Owner-only, with no staff read policy — an admin has no reason to browse
-- what a customer has in their bag, and it is the kind of access that is
-- awkward to justify later.

alter table cart_items enable row level security;
alter table wishlist_items enable row level security;

create policy cart_items_own on cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy wishlist_items_own on wishlist_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
