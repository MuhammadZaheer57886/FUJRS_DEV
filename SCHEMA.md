# FUJRS — Proposed Database Schema

**Status:** applied. All 10 migrations in `supabase/migrations/` are deployed to
the linked Supabase project. The app does not read from it yet — see
[BACKEND_SETUP.md](./BACKEND_SETUP.md).
**Derived from:** the finished UI, not from the spec's sketch. Every column
below exists because a screen reads or writes it; the screen is cited.
**Date:** 4 August 2026

Three of the Section 8 open questions in [REQUIREMENTS.md](./REQUIREMENTS.md)
change the structure below — those points are marked **⚠️ DECISION**, with the
recommended default stated inline so they can be built either way. Everything
else is settled enough to build now.

Target is **PostgreSQL**. Conventions: `snake_case` (translated to camelCase at
the store boundary, per [CLAUDE.md](./CLAUDE.md)), UUID primary keys,
`timestamptz` throughout, monetary amounts as **integer paisa** — never floats,
because `45000.1 + 350.2` in floating point is not `45350.3` and money must
reconcile exactly.

---

## Entity overview

```
users ──┬── addresses
        ├── cart_items          guest or registered — same table
        ├── wishlist_items
        ├── orders ──┬── order_items ── stitching_requests ── stitching_reference_images
        │            └── payments
        ├── affiliate_links
        ├── referral_clicks ──┐
        ├── commissions ──────┘
        ├── payout_methods
        └── payout_requests

products ──┬── product_images
           └── product_variants

role_permissions   (flat role × category grid — see §9)

auth.users  (Supabase-owned) ──1:1── users   via triggers, incl. anonymous guests

storage buckets: product-images (public), avatars (public),
                 stitching-references (private)
```

---

## 1. Users and access

The app has five roles, defined in `src/lib/auth/roles.ts`. Staff are created
by a Super Admin; customers self-register.

```sql
create type app_role as enum ('CUSTOMER','ADMIN','VENDOR','TAILOR','SUPER_ADMIN');

create table users (
  id            uuid primary key default gen_random_uuid(),

  -- Nullable: an anonymous guest has neither until they register.
  email         citext,
  name          text,
  is_anonymous  boolean not null default false,

  role          app_role not null default 'CUSTOMER',
  password_hash text,                    -- null until they set one
  avatar_path   text,                    -- path in the avatars bucket
  is_active     boolean not null default true,
  created_by    uuid references users(id),   -- Super Admin who created staff
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on users (role) where is_active;

-- Unique among users who HAVE an email — every guest row shares a null, so a
-- plain unique constraint would allow exactly one guest to exist.
create unique index on users (email) where email is not null;
```

`citext` makes email comparison case-insensitive, which the local store does
manually with `normalizeEmail` today (`src/lib/local/profile.ts`).

**Do not store passwords.** `password_hash` holds an Argon2id or bcrypt digest,
or stays null if you use a managed auth provider. The current build stores
nothing, deliberately.

`created_by` records the Super Admin who created a staff account — spec §2 asks
for it and the Users tab in `SuperAdminView.tsx` displays the list.

### Addresses

The checkout saves one address per customer (`src/lib/local/profile.ts`), but
customers realistically ship to more than one place, so this is its own table
from the start rather than columns on `users`.

```sql
create table addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  street       text not null,
  city         text not null,
  postal_code  text not null,
  country      text not null default 'PK',
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);
create unique index on addresses (user_id) where is_default;
```

That partial unique index enforces at most one default address per user — a
constraint worth having in the database rather than trusting application code.

---

## 2. Products

From the `Product` interface in `src/data/products.ts` plus the admin form in
`src/components/dashboard/ProductForm.tsx`.

```sql
create type product_gender as enum ('Women','Men','Unisex');

create table products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  description        text not null,
  price_paisa        bigint not null check (price_paisa >= 0),
  compare_at_paisa   bigint check (compare_at_paisa >= price_paisa),
  fabric             text not null,
  category           text not null,
  gender             product_gender not null,
  color              text not null,
  sku                text unique,
  stock              integer not null default 0 check (stock >= 0),
  is_new_arrival     boolean not null default false,
  stitching_eligible boolean not null default false,
  stitching_addon_paisa bigint check (stitching_addon_paisa >= 0),
  badge              text,
  heritage_story     text,
  embroidery         text,
  dupatta_info       text,
  meters             text,
  rating             numeric(2,1) check (rating between 0 and 5),
  review_count       integer not null default 0,
  created_by         uuid references users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  archived_at        timestamptz
);
create index on products (category, gender) where archived_at is null;
create index on products (fabric) where archived_at is null;
```

**Archive, don't delete.** `removeItem` in `src/lib/local/catalog.ts` deletes
outright, which is fine for a browser store but wrong for a database: orders
reference products, and a deleted product would orphan order history. Deletion
in the admin UI should set `archived_at`.

`rating` and `review_count` are denormalised counters — recomputed from a
`reviews` table when that's built, not maintained by hand.

```sql
create table product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,

  -- Object path in the product-images bucket, NOT a full URL.
  storage_path  text not null,
  alt           text,
  position      integer not null default 0,

  -- Required by next/image to reserve space and avoid layout shift.
  width         integer not null check (width > 0),
  height        integer not null check (height > 0),
  bytes         bigint check (bytes > 0),
  mime_type     text not null,
  blur_data_url text,

  created_at    timestamptz not null default now()
);
create index on product_images (product_id, position);

-- Exactly one primary image per product, enforced rather than assumed.
create unique index on product_images (product_id) where position = 0;
```

Images are separate because a PDP shows several and order matters. **Store
object paths, never data URLs and never full URLs** — the current build inlines
base64 into `localStorage` and already hits the ~5MB quota
(`CatalogStorageError`). See "Images" below for the buckets and sizing rules.

### ⚠️ Size and colour variants

The catalogue filter gap in [TASKS.md](./TASKS.md) resolves here. `products.sizes`
is an array on a single row today, which can't carry per-size stock.

```sql
create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  size        text not null,
  stock       integer not null default 0 check (stock >= 0),
  sku         text unique,
  unique (product_id, size)
);
```

If you never track stock per size, drop this table and keep a `sizes text[]`
column on `products`. Worth confirming with the client — it's cheap now,
awkward later.

---

## 2a. Product taxonomy

`products.category`, `.fabric`, `.color`, `.badge` and `.embroidery` began as
free text typed into the dashboard form, and the storefront built its filter
facets from the distinct set of whatever was typed. That is a data-quality bug
with a visible symptom: eighteen seeded products already produced three separate
blues (`Deep Navy`, `Midnight Blue`, `Pastel Blue`), four off-whites, three
silks (`Silk`, `Raw Silk`, `Pure Raw Silk (80gm)`) and two badges meaning the
same thing. The first product created through the live dashboard was filed under
category `"2 pice"`.

Migration 18 replaces each with a managed list, referenced by id:

| Table | Carries beyond the label |
| --- | --- |
| `product_categories` | `gender` scope, plus the defaults a new product inherits |
| `fabrics` | — (weight moved to `products.fabric_weight_gsm`) |
| `colors` | `hex` for the swatch, `family` for the filter axis |
| `badges` | — |
| `size_scales` | `size_values text[]`, ordered |
| `embroidery_techniques` | many-to-many via `product_embroidery` |

**One table per taxonomy, not a single `product_options (kind, …)`.** They do
not share a column set — a colour has a hex and a family, a category has
defaults, a size scale has an ordered array. Collapsing them into one table
would make every one of those nullable and push "which columns apply to this
kind" into application code, which is the one-true-lookup-table anti-pattern.

**Colour is two fields.** `colors.label` is the marketing name shown on the
product page; `colors.family` is a fixed enum (16 values) that the storefront
facets on. "Midnight Blue" and "Deep Navy" both file under `BLUE`, so the filter
list stays 16 rows however many colours are added. The family is an enum rather
than a table on purpose — it is the filter axis, and an editable axis drifts
straight back to the problem being fixed.

**Three columns were split, not just constrained.** `meters` was
`"4.5 Meters (Standard Suit)"` → `meters_length numeric` + `meters_note`.
`dupatta_info` was `"2.5 Meters Organza with Border"` → `dupatta_length` +
`dupatta_fabric_id` + `dupatta_finish`. `embroidery` was the CSV string
`"Gold Tilla, Zardozi, Sequins"` → junction rows.

**Archive, never delete.** Every lookup FK is `on delete restrict`, and rows
carry `archived_at`. Archiving stops an option being offered without changing
what a published product says it is. RLS therefore allows reading archived rows
— hiding them would make an archived colour read as a missing colour on a NOT
NULL domain field. Writes are Super Admin only.

Migration 18 only adds; migration 19 drops the legacy text columns and is held
back deliberately. See the header of
`supabase/migrations/20260806000019_drop_legacy_product_text.sql` for the
checklist before pushing it.

The same seed exists three times, joined by slug, and all three must agree:
the SQL block in migration 18, `src/lib/data/static/taxonomy.ts` (the `local`
backend, which has no database), and `scripts/generate-seed.mjs` (which reads
its slugs from the second rather than re-deriving them).

---

## 3. Orders

From `src/lib/local/orders.ts` and `src/lib/orderStatus.ts`.

```sql
create type order_status as enum
  ('CONFIRMED','PROCESSING','DELIVERED','CANCELLED','REFUNDED');

create table orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,   -- human-facing, e.g. 2VVS7D5B
  user_id           uuid references users(id),  -- null for guest checkout
  status            order_status not null default 'CONFIRMED',

  fabric_total_paisa    bigint not null,
  stitching_total_paisa bigint not null default 0,
  shipping_paisa        bigint not null default 0,
  total_paisa           bigint not null,

  -- Copied, not referenced: the delivery address must not change if the
  -- customer later edits their saved address.
  ship_first_name text not null,
  ship_last_name  text not null,
  ship_street     text not null,
  ship_city       text not null,
  ship_postal     text not null,
  contact_email   text not null,

  referral_code   text,             -- see §5
  placed_at       timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on orders (user_id, placed_at desc);
create index on orders (status);
create index on orders (referral_code) where referral_code is not null;
```

The shipping address is **copied onto the order**, not foreign-keyed. An order
is a historical record of where something was actually sent; if it pointed at
`addresses.id` and the customer edited that row, every past order would silently
rewrite itself.

`order_number` is the short code the UI already shows (`#2VVS7D5B`). Give
customers this, never the UUID.

```sql
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  product_id     uuid references products(id),   -- null if archived
  variant_id     uuid references product_variants(id),

  -- Snapshot at purchase time. Prices change; invoices must not.
  title          text not null,
  image_url      text,
  unit_price_paisa bigint not null,
  quantity       integer not null check (quantity > 0),

  stitching_label       text,
  stitching_addon_paisa bigint
);
create index on order_items (order_id);
```

Same reasoning: `title` and `unit_price_paisa` are snapshots. A price rise must
never retroactively change what a customer was charged.

### Status transitions

`src/lib/orderStatus.ts` defines the legal moves, and the admin UI already
refuses illegal ones. **Enforce them server-side too** — the client check is UX,
not a boundary (per [CLAUDE.md](./CLAUDE.md)).

```
CONFIRMED  → PROCESSING, CANCELLED
PROCESSING → DELIVERED, CANCELLED
DELIVERED  → REFUNDED
CANCELLED  → REFUNDED
REFUNDED   → (terminal)
```

An audit trail is worth having, since refunds are money moving:

```sql
create table order_status_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references users(id),
  note        text,
  created_at  timestamptz not null default now()
);
create index on order_status_events (order_id, created_at);
```

---

## 4. Stitching requests

⚠️ **This is the one place I'd argue against the original spec.** Section 6 puts
`StitchingRequest` under `Order`. The Tailor spec sheet in
`src/components/dashboard/TailorView.tsx` reads measurements, style choices and
notes as a unit, independently of order totals — and `/tailoring/configure`
captures them *before* an order exists. It deserves its own table.

```sql
create type stitching_status as enum
  ('AWAITING_MEASUREMENTS','IN_PROGRESS','QUALITY_CHECK','READY_FOR_FITTING','DELIVERED');

create table stitching_requests (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid unique references order_items(id) on delete cascade,
  user_id       uuid not null references users(id),
  assigned_tailor_id uuid references users(id),

  status        stitching_status not null default 'AWAITING_MEASUREMENTS',
  garment_type  text not null,
  neckline      text,
  sleeve        text,
  hemline       text,
  notes         text,

  -- The 12 fields from src/lib/measurements.ts, in inches.
  measurements  jsonb not null default '{}'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on stitching_requests (assigned_tailor_id, status);
create index on stitching_requests (user_id);
```

`order_item_id` is **nullable** — that's what lets a request exist before
checkout, which the current flow needs.

**Why `jsonb` for measurements:** twelve `numeric` columns would be more
rigorous, but the field list is still being tuned with the client, and a
garment type may eventually need different fields. `jsonb` absorbs that without
a migration per change. Validate the shape in the application against
`MEASUREMENT_FIELDS`, and add a check constraint once the list is final.

The enum values are `SCREAMING_CASE` while the UI shows `"Awaiting
Measurements"` — map at the boundary, as `CLAUDE.md` requires. Confirm the final
stage names with the client: they differ from the spec's suggested
Submitted/Confirmed/In Progress/Ready/Shipped.

```sql
create table stitching_reference_images (
  id                   uuid primary key default gen_random_uuid(),
  stitching_request_id uuid not null references stitching_requests(id) on delete cascade,
  url                  text not null,
  uploaded_at          timestamptz not null default now()
);
```

Not built in the UI yet (spec §3.2 asks for it) — the table is here so the
upload work doesn't need a migration.

### ⚠️ DECISION 1 — in-house vs external workshops

The above assumes **in-house tailors**: `assigned_tailor_id` points at a user
with role `TAILOR`. If the client chooses external partners, add:

```sql
-- Only if fulfilment is outsourced.
create table workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email citext,
  commission_terms text,
  is_active boolean not null default true
);
-- then: stitching_requests.workshop_id uuid references workshops(id)
```

Plus per-workshop payouts and logins. **Don't build this until they ask for
it** — it's the single most expensive unanswered question.

---

## 5. Affiliate system

From `src/lib/local/affiliate.ts`, `src/lib/local/referral.ts` and
`src/lib/commission.ts`.

```sql
alter table users add column referral_code text unique;   -- vendors only
```

The build derives the code from a hash of the vendor's email so it survives a
reload without storage. **The real one should be issued and stored**, not
derived — deriving it means a vendor can never change their email without
losing their code, and their code leaks a fact about their email.

```sql
create table affiliate_links (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (vendor_id, product_id)
);
```

The unique constraint matches `addLink`, which refreshes rather than duplicates.

```sql
create table referral_clicks (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references users(id) on delete cascade,
  product_id    uuid references products(id),
  visitor_token text not null,        -- anonymous cookie id, not a user id
  ip_hash       text,                 -- hashed, never raw
  user_agent    text,
  clicked_at    timestamptz not null default now()
);
create index on referral_clicks (visitor_token, clicked_at desc);
create index on referral_clicks (vendor_id, clicked_at desc);
```

**This is the table the browser build cannot have** — it's the whole reason the
dashboards say "clicks need a backend before they're real". Attribution is a
server-side fact about traffic the server saw.

Store `ip_hash`, not the IP. Raw IPs are personal data under most privacy
regimes and you have no use for them beyond deduplication.

### Commission

```sql
create type commission_type   as enum ('PERCENT','FLAT');
create type commission_status as enum ('PENDING','CREDITED','PAID','REVERSED');

alter table users
  add column commission_type  commission_type default 'PERCENT',
  add column commission_value numeric(10,2) default 10;

create table commissions (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references users(id),
  order_id     uuid not null references orders(id),
  status       commission_status not null default 'PENDING',

  -- The rate is copied, not looked up: changing a vendor's rate must not
  -- retroactively rewrite commission they already earned.
  rate_type    commission_type not null,
  rate_value   numeric(10,2) not null,
  sale_paisa   bigint not null,
  amount_paisa bigint not null,

  credited_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (vendor_id, order_id)
);
create index on commissions (vendor_id, status);
```

Copying the rate onto the row is the same snapshot principle as order line
items, and it matters more here because it's the vendor's money.

`REVERSED` handles the refund case: the vendor dashboard already says "a sale
counts once the order is confirmed and the return window has closed." When an
order goes to `REFUNDED`, its commission must go to `REVERSED`. **This is the
easiest place in the whole system to lose money** — if refunds don't claw back
commission, you pay out on sales that were returned.

### Not blocked: commission model, link model, attribution window

The structure above already supports both commission models (percent and flat)
and both link models (per-product links and a general referral code), so
neither open question changes it. The attribution window — 30 days, last touch
in the current build — is application logic reading `referral_clicks`, not a
column. All three are safe to defer indefinitely.

---

## 6. Payouts

From `src/lib/local/payouts.ts`.

```sql
create type payout_status as enum ('REQUESTED','PROCESSING','PAID','REJECTED');

create table payout_requests (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references users(id),
  amount_paisa bigint not null check (amount_paisa > 0),
  status       payout_status not null default 'REQUESTED',
  method_id    uuid references payout_methods(id),
  reference    text,                   -- bank/wallet transaction ref once paid
  note         text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references users(id)
);
create index on payout_requests (vendor_id, requested_at desc);
create index on payout_requests (status) where status in ('REQUESTED','PROCESSING');
```

`REJECTED` isn't in the UI yet — add it there when the admin-side payout
approval screen is built.

The available balance is **derived, never stored**: credited commission minus
everything in an open or paid request. `availableToRequest` already computes it
this way. A stored balance column is a bug waiting to happen — it drifts the
first time a write fails halfway.

### ⚠️ DECISION 2 — payout destination

```sql
create type payout_method_kind as enum ('BANK','JAZZCASH','EASYPAISA');

create table payout_methods (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references users(id) on delete cascade,
  kind         payout_method_kind not null,
  account_name text not null,
  account_ref  text not null,          -- IBAN, or wallet mobile number
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);
create unique index on payout_methods (vendor_id) where is_default;
```

**This table holds financial PII.** It should be restricted so a vendor can read
only their own row and only a Super Admin can read across vendors, and it should
stay out of general application logs. If the client chooses bank-only or
wallet-only, drop the unused enum values — everything else stands.

---

## 7. Payments

### ⚠️ DECISION 3 — payment methods

```sql
create type payment_method as enum ('COD','CARD','BANK_TRANSFER','JAZZCASH','EASYPAISA');
create type payment_status as enum ('PENDING','PAID','FAILED','REFUNDED');

create table payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  method         payment_method not null,
  status         payment_status not null default 'PENDING',
  amount_paisa   bigint not null,
  provider       text,                -- 'safepay', 'payfast', null for COD
  provider_ref   text,                -- provider transaction id
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index on payments (order_id);
create unique index on payments (provider, provider_ref)
  where provider_ref is not null;
```

A separate table rather than columns on `orders`, because a refund is a second
payment record against the same order, and reconciliation needs both.

That unique index on `(provider, provider_ref)` makes **double-charging
impossible at the database level** if a webhook fires twice — which they do.
Worth having regardless of provider.

> ⚠️ **Stripe does not operate in Pakistan.** It cannot onboard a
> Pakistan-registered business, so the earlier Stripe integration could never
> have gone live. Worth confirming independently before signing anything, but
> plan on **Safepay** or **PayFast** — both handle PKR cards and bundle
> JazzCash/Easypaisa, so one integration covers card and wallet together.

---

## 8. Reviews

Not built in the UI. Products carry `rating` and `review_count` with nothing
rendering them, so the table is sketched but shouldn't be built until the
screens exist.

```sql
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references users(id),
  order_id    uuid references orders(id),     -- verified-purchase marker
  rating      integer not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
```

**Review text is user input rendered on a public page.** Never render it with
`dangerouslySetInnerHTML` — JSX escaping is the defence, per `CLAUDE.md`.

---

## 9. Permissions

⚠️ **A recommendation to reduce scope.** Spec §4.2 asks for per-user
permissions via `Permission` and `UserPermission` tables. The built UI does
**role × category** toggles instead (`SuperAdminView.tsx`, categories:
Products, Orders, Stitching, Vendors, Reports).

For a five-role application, per-user permissions are a large surface — a
management screen, an assignment flow, a resolution layer on every request —
solving a problem that hasn't appeared. Role-level covers it:

```sql
create type access_category as enum
  ('PRODUCTS','ORDERS','STITCHING','VENDORS','REPORTS');

create table role_permissions (
  role     app_role not null,
  category access_category not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (role, category)
);
```

If the client insists on per-user, the migration is additive — a
`user_permissions` table overriding `role_permissions`, resolved
user-first-then-role. Nothing above needs to change. **Recommendation: ship
role-level, revisit only if a real case appears.**

---

## Cross-cutting notes

**Money.** Every amount is `bigint` paisa. Never `float`, never `real`. If you
prefer decimals use `numeric(12,2)`, but pick one and apply it everywhere —
mixing the two across tables is how reconciliation bugs start.

**Timestamps.** `timestamptz`, always. The app already serialises ISO strings.

**Soft delete.** Products archive rather than delete. Users deactivate
(`is_active`) rather than delete — spec §4.1 says "deactivate", and deleting a
user with order history breaks that history.

**Row-level security.** If you go with Supabase or anything exposing Postgres
directly, RLS is mandatory, not optional. Minimum: a vendor reads only their own
`commissions`, `payout_requests` and `payout_methods`; a customer reads only
their own `orders`; a tailor reads only `stitching_requests` assigned to them.
Without RLS a client-side query can read every vendor's earnings.

**Validate server-side.** Every check in the current UI — commission bounds,
payout minimums, status transitions, measurement completeness — is UX only. All
of it must be re-implemented in API routes. A client can send any payload.

---

## Migration status

Written in `supabase/migrations/`, **not yet applied or validated**:

| # | Migration | Covers |
|---|---|---|
| 1 | `init_schema` | extensions, `app_role`, `users`, `addresses` |
| 2 | `products` | `products`, `product_images`, `product_variants` |
| 3 | `orders` | `orders`, `order_items`, `order_status_events`, transition trigger |
| 4 | `stitching` | `stitching_requests`, `stitching_reference_images` |
| 5 | `affiliate` | `affiliate_links`, `referral_clicks`, `commissions`, refund clawback |
| 6 | `rls` | policies + `is_staff()` / `is_super_admin()` helpers |
| 7 | `permissions_payouts` | `role_permissions` (seeded), `payout_requests` |
| 8 | `auth_integration` | `auth.users` → `public.users` triggers, anonymous guests |
| 9 | `cart_wishlist` | `cart_items`, `wishlist_items` |
| 10 | `storage` | three buckets + object access policies |

Not written, and why:

| Table | Blocked on |
|---|---|
| `payments` | Which provider and methods (REQUIREMENTS.md §8) |
| `payout_methods` | Bank vs mobile wallet — different columns |
| `reviews` | Nothing; no UI renders reviews yet |
| `workshops` | Only exists if stitching is outsourced — don't build speculatively |

Run `supabase start && supabase db reset` to replay 1–10 locally and confirm
they apply cleanly before pushing to any shared database. See
[BACKEND_SETUP.md](./BACKEND_SETUP.md).

### Anonymous guests

Every first-time visitor is signed in anonymously, so a guest owns a real uuid
from their first click and keeps it when they register. Consequences for the
schema, all in migrations 1, 8 and 9:

- `users.email` and `users.name` are **nullable** — an anonymous user has
  neither. Uniqueness on email is a partial index (`where email is not null`),
  since every guest row shares a null.
- `users.is_anonymous` mirrors `auth.users.is_anonymous`.
- Two check constraints: a guest has no email, and a guest is always
  `CUSTOMER`.
- `cart_items` and `wishlist_items` are owned by `user_id` with no special
  guest path — a guest cart is an ordinary RLS-scoped row.
- `orders.user_id` stays nullable, but with anonymous auth it is normally
  populated even for guest checkout.

**`users.id` is the identity key, not email.** `src/lib/local/profile.ts` keys
on email, which is fine for a browser store but wrong here — an anonymous user
has no email to key on.

### Images

Three buckets, created in migration 10:

| Bucket | Access | Limit | Holds |
|---|---|---|---|
| `product-images` | public | 5 MB | catalogue photography |
| `avatars` | public | 2 MB | profile pictures |
| `stitching-references` | **private** | 10 MB | customer-supplied photos |

The last one is private deliberately. A "public" bucket means anyone with the
URL fetches the object forever with no session — right for catalogue photos,
wrong for a photo a customer uploaded of a garment they own or of themselves.
Serve those with `createSignedUrl()` and a short expiry.

**Rows store an object path, never a full URL.** A public URL embeds the
project ref (`https://<ref>.supabase.co/storage/v1/object/public/…`), so
storing it bakes that ref into every row — moving projects, adding a CDN, or
leaving Supabase would mean rewriting the whole table. The adapter calls
`getPublicUrl(path)`, which is one line. If you'd rather hold the literal URL,
it's a one-column change, but it costs you that portability.

**Dimensions are stored because `next/image` needs them.** `product_images`
carries `width`, `height`, `bytes`, `mime_type` and an optional
`blur_data_url`. Without intrinsic width and height the browser can't reserve
space, so the grid reflows as each file arrives — the most visible way a
product page looks unfinished.

Storage enforces byte size and mime type; it cannot see pixel dimensions, so
the upload UI must read them and reject bad sources with a reason:

| Use | Ratio | Recommended | Minimum |
|---|---|---|---|
| Product | 4:5 portrait | 1600×2000 | 1200×1500 |
| Avatar | 1:1 | 512×512 | 256×256 |
| Banner | 16:9 | 2400×1350 | — |

4:5 isn't arbitrary — it's the ratio 24 of the app's existing image slots
already use (`aspect-[4/5]`). Convert to WebP on upload where you can: about
30% smaller than JPEG at equal quality, supported everywhere FUJRS targets.

Steps 1–4 are unblocked today. Only 5 and 7 wait on the client.
