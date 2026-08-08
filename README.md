# FUJRS — Premium Fashion & Bespoke Tailoring

A Next.js storefront and staff dashboard for a single-brand fashion &
bespoke-tailoring business.

> **The app still runs entirely in the browser.** Every screen reads and
> writes `localStorage`; there is no auth or payment provider. Clone,
> `npm install`, `npm run dev`, done — no `.env`, nothing to provision.
>
> **The database now exists but isn't connected yet.** The Supabase schema is
> designed and deployed (`supabase/migrations/`, 10 migrations applied), and
> the next step is the data-layer adapters that let the app read it. Until
> those land, the browser is still the source of truth.

| Doc | What it's for |
|---|---|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | The product spec — what the client asked for |
| [TASKS.md](./TASKS.md) | What's actually built against that spec |
| [SCHEMA.md](./SCHEMA.md) | Database reference — every table and why it exists |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Supabase mechanics + the swappable data layer |
| [CLAUDE.md](./CLAUDE.md) | Conventions for anyone (or any agent) working here |

## Stack

- **Framework**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Runtime dependencies**: `next`, `react`, `react-dom` — that's all
- **Catalog**: static data in `src/data/products.ts` and `src/data/stitchers.ts`

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

### Getting a staff account

There are no demo logins. How you get one depends on the backend:

**On browser storage (`NEXT_PUBLIC_DATA_BACKEND=local`)** — register at
`/register`. **The first account on a fresh browser becomes Super Admin**, and
from there you create Admin, Vendor and Tailor accounts in the dashboard. Any
password works; passwords are deliberately never stored, because there is
nothing to authenticate against. Clearing site data resets it.

**On Supabase** — register at `/register`, then promote yourself once in the
SQL editor with [supabase/promote-staff.sql](./supabase/promote-staff.sql).
That step is deliberately manual: sign-up hard-codes `CUSTOMER` and never reads
a role from the client, so a self-assigned Super Admin isn't possible. Every
account after the first is created from the dashboard.

## Where the data lives

Everything is in `localStorage`, behind a single data layer. Components import
from `@/lib/data` and never learn which backend is running, so connecting
Supabase means writing adapters — not touching components.

```
src/lib/data/
  types.ts     domain shapes
  ports.ts     async interfaces every backend implements
  local/       localStorage adapter (all of it, via local/storage.ts)
  index.ts     picks the adapter
```

| Store | Import | Key |
|---|---|---|
| Orders | `orders` | `fujrs-orders` |
| Accounts + saved address | `profiles` | `fujrs-accounts` |
| Catalogue additions | `catalog` | `fujrs-catalog` |
| Bag | `cart` | `fujrs-cart` |
| Wishlist | `wishlist` | `fujrs-wishlist` |
| Measurements | `tailoring` | `fujrs-tailoring-config` |
| Affiliate links | `affiliate` | `fujrs-affiliate-links` |
| Captured referral | `referrals` | `fujrs-referral` |
| Payout requests | `payouts` | `fujrs-payout-requests` |
| Session | `src/lib/auth/session.ts` | `fujrs-session` |

Every method is `async` even on browser storage — deliberately, so components
handle awaiting once rather than changing again when the network arrives.

The four role dashboards render fixtures from `src/lib/auth/demoData.ts` and
say so on screen. Their actions (approve draft, change stitching status,
create user, toggle access) update local state only.

Clearing site data resets the app to a fresh install.

## What works end to end

Browse → product detail → add to bag → checkout (shipping, Cash on
Delivery) → order confirmation → order history → order detail with live
bespoke stitching progress. Wishlist, catalog filters, search, the full
tailoring configurator with live pricing, and all four role dashboards.

## What's deliberately stubbed

These show the real UI and a "coming soon" toast rather than a dead button:

- **Card payments** — Cash on Delivery is the only method that completes an
  order
- **Promo codes**
- **Password changes** and the forgot/reset-password flow (validation runs;
  nothing is saved)
- **Email verification** on an email change

Missing screens on the staff side (admin product CRUD, order actions,
reports, the real vendor affiliate system) are tracked in
[TASKS.md](./TASKS.md).

## Site structure (source → route mapping)

| Source design | FUJRS route |
|---|---|
| homepage | `/` |
| men's unstitched collections | `/men` |
| women's unstitched collections | `/women` |
| PDP (product detail) | `/products/[slug]` |
| the Atelier (custom stitching service) | `/tailoring` |
| bespoke measurements & style selection | `/tailoring/configure` |
| bespoke confirmation | `/tailoring/review` |
| discover master stitchers | `/tailoring/stitchers` |
| master stitcher profile | `/tailoring/stitchers/[slug]` |
| shopping bag | `/cart` |
| secure checkout | `/checkout` |
| order confirmation | `/checkout/confirmation` |
| about us | `/about` |
| contact us | `/contact` |
| returns & exchanges | `/returns-exchanges` |
| terms & conditions | `/terms` |
| account / dashboard | `/account`, `/dashboard` |

## Marketplace → single-brand adaptations

The source designs were marketplace/multi-vendor patterns (seller badges,
"Sold by X Official," external designer credits, a "Marketplace" nav link).
Every instance was adapted to single-brand FUJRS, consistently across the
whole app:

- "Shop by Seller" → **"Our Ateliers"** (in-house specialty studios: Bridal
  Atelier, Prêt Studio, Menswear Guild)
- Individual artisan/seller credits → **Master Stitchers**, an internal
  FUJRS tailoring team with their own directory and profiles
- "Sold by [Brand] Official" / "Verified Seller" badges → "Sold by FUJRS" /
  dropped where purely marketplace-signaling
- Terms & Conditions' "Marketplace Seller Policies" → "Product Quality &
  Descriptions"
- Cart's seller-grouped sections → single "Sold by FUJRS" section

## Deployment

Deploys as a static-first Next.js app. Use `npm ci` as the install command for
deterministic builds.

No environment variables are needed while the app runs on browser storage.
Once the Supabase adapters exist it needs `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_DATA_BACKEND=supabase` — see
[.env.example](./.env.example).

Product images currently reference `lh3.googleusercontent.com` (a
design-tool preview CDN, whitelisted in `next.config.mjs`). Migrate to your
own asset storage (Vercel Blob, Cloudinary, S3) before relying on this in
production — it isn't meant for long-term hosting.

## Connecting the backend

1. ~~Design the schema against these finished screens.~~ Done —
   [SCHEMA.md](./SCHEMA.md), deployed via `supabase/migrations/`.
2. Make the modules in the table above `async` while still on `localStorage`,
   so components change once rather than twice.
3. Move `CartContext`, `WishlistContext` and `TailoringContext` storage into
   the data layer — they're the three that still hold `localStorage` inline.
4. Write the Supabase adapters behind the same interfaces, then flip
   `NEXT_PUBLIC_DATA_BACKEND`. No component changes.
5. Re-validate every payload server-side. The client-side validation in these
   forms is UX, not a security boundary.

Full detail in [BACKEND_SETUP.md](./BACKEND_SETUP.md).
