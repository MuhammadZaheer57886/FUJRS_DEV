# FUJRS — Task Status (vs. REQUIREMENTS.md)

Gap analysis of the current codebase against [REQUIREMENTS.md](./REQUIREMENTS.md)
Section 7's Phase 1 scope. Verified directly against the code on
**2026-08-04**, not against old build-log narration.

> **This is a UI-only build.** No Supabase, no Stripe, no API routes, no
> database — the backend was removed on purpose so the UI/UX could be
> finalised first and the schema designed against the finished screens. Auth
> is a localStorage session; cart, wishlist, measurements, orders, catalogue,
> affiliate links and payout requests all persist to `localStorage` through
> modules in `src/lib/local/`. Dashboards render fixtures from
> `src/lib/auth/demoData.ts`. See [README.md](./README.md) and
> [CLAUDE.md](./CLAUDE.md) for how it runs today.
>
> Read every ✅ below as "UI complete, persistence pending".

**The UI is now feature-complete for Phase 1.** The remaining work is
deliberate deferrals (listed under "Not built — deferred to the backend") and
the Section 8 decisions, which are the real blocker on writing the schema.

## 3.1 Standard Shopping — done

- [x] Product catalog, categories, search, cart, checkout, order confirmation
- [x] PDP: images, description, price, stock, add to cart
- [x] Order history and per-order detail for registered customers (`/account`)
- [x] Cash on Delivery completes an order; card shows a "coming soon" notice
- [ ] Filters by size/color/fabric across the full catalog — each collection
      page filters by fabric only. `Product` already carries `color` and
      `sizes`, so the data is there; the unified filter UI is not built.
- Note: the catalogue now comes through the data layer. On `supabase` the
  storefront reads the `products` table, so a piece published from the
  dashboard is in the shop immediately. On `local` it reads
  `src/data/products.ts` mapped to `CatalogItem`, and dashboard-added pieces
  stay in the browser that added them. `Product` is retired — `CatalogItem`
  from `@/lib/data` is the one product shape.

## 3.2 Custom Stitching Service — done

- [x] Customer submits measurements (12 fields, guided panel) and
      fabric/style choices at `/tailoring/configure`
- [x] Live pricing (base + neckline/sleeve/hemline add-ons)
- [x] Distinct status flow, separate from standard orders:
      `Awaiting Measurements → In Progress → Quality Check → Ready for
      Fitting → Delivered` (naming differs from the spec's suggested
      Submitted/Confirmed/In Progress/Ready/Shipped — functionally
      equivalent, still worth confirming the exact stage names with the client)
- [x] Status visible to the customer (`/tailoring/review`) and to the Tailor
      role (`/dashboard`)
- [x] **Tailor sees the full spec sheet** — all 12 measurements, the cut &
      finish choices, and customer notes, with missing measurements called
      out. `MEASUREMENT_FIELDS` now lives in `src/lib/measurements.ts` so the
      form, the review screen and the dashboard share one definition.
- [ ] Reference-image upload during submission — not built (no storage layer)

## 4.1/4.2 Admin Dashboard & Permission Model — mostly done

- [x] Orders: view, open a detail panel (items, totals, ship-to, payment,
      referral attribution)
- [x] **Order status management including cancel and refund** —
      `src/components/dashboard/OrderManager.tsx`. Legal moves come from
      `nextStatuses()` in `src/lib/orderStatus.ts`, so the UI can't offer an
      illegal transition: cancel is unavailable once delivered, refund is
      terminal. Orders placed in this browser are actionable; the sample rows
      are labelled as fixtures and aren't.
- [x] **Product management** — `CatalogManager` / `ProductForm` /
      `CatalogTable`, backed by `src/lib/data/`. Add and remove publish
      immediately; there is no review queue. The form now captures every
      column the storefront renders — colour, sizes, stock, SKU, was-price,
      stitching eligibility and charge, badge, meters, embroidery, dupatta and
      heritage story — and image uploads carry their measured dimensions, so
      `product_images.width`/`.height` are real rather than assumed.
- [x] Stitching queue: view + update status (Tailor role)
- [x] **Super Admin user management** — create users, list all users, set
      per-vendor commission rates (`SuperAdminView.tsx`)
- [~] **Granular permission model** — `SuperAdminView`'s Access tab toggles
      access per **role × category**, not per user. Section 4.2 asks for
      per-user toggles with `Permission` / `UserPermission` tables.
      **Recommendation: amend the spec to role-level and drop the per-user
      model** — it's a large surface for a five-role app, and nothing in the
      product needs two admins with different permissions.
- [ ] Reports & analytics beyond the revenue trend and orders-by-status
      charts — not built

## 5. Vendor / Affiliate System — done

The vendor is an affiliate marketer: they take a tracked link for any piece,
promote it, and earn commission. They never add or price products.

- [x] Trackable link per product, plus a stable per-vendor referral code
      (`src/lib/local/affiliate.ts`)
- [x] **Referral capture on the storefront** — `?ref=` is validated against
      the issued code shape and held for a 30-day attribution window
      (`src/lib/local/referral.ts`). A sitewide bar tells the shopper their
      visit is credited; the code is shown at checkout, stamped onto the
      order by `createOrder`, and surfaced on the confirmation, the
      customer's order detail, and the admin's order view.
- [x] Commission calculation, flat or percentage (`src/lib/commission.ts`),
      shared by the vendor and Super Admin screens so the number can't drift
- [x] Vendor wallet: earned to date, pending, available to withdraw
- [x] **Payout request flow** (`src/lib/local/payouts.ts`) — minimum
      withdrawal enforced, can't request more than is available, open
      requests reduce the available balance
- [ ] Click/sale attribution as a *fact* rather than a provisional claim —
      needs a server that sees the traffic. The browser can hold a code but
      can't prove a sale came from it, and the dashboards say so on screen.

## 6. Data Model — what the screens now imply

The finished UI pins down these entities. This is the input to the schema:

- **User** — id, name, email, role (`CUSTOMER | ADMIN | VENDOR | TAILOR |
  SUPER_ADMIN`), plus `commissionType` / `commissionValue` on vendors
- **Product** — the `Product` interface in `src/data/products.ts`
- **Order** — status (`CONFIRMED | PROCESSING | DELIVERED | CANCELLED |
  REFUNDED`), fabric/stitching/shipping/total, ship-to, payment method, and
  **`referralCode`**
- **OrderItem** — product, qty, price, and the stitching fields
- **StitchingRequest** — the 12 measurements, neckline/sleeve/hemline,
  customer notes, assigned tailor, and its own status. The Tailor spec sheet
  is the argument for making this its own table rather than columns on
  `order_items`: it exists before an order does and is read independently.
- **AffiliateLink** — vendor, product, created-at
- **ReferralClick / Commission** — the attribution the browser can't do
- **PayoutRequest** — vendor, amount, requested-at, status
  (`Requested | Processing | Paid`)

Still absent by design: `Permission` / `UserPermission`, pending the
Section 4.2 decision above.

## 7. Phase 1 scope — overall status

- [x] Storefront: browse, product detail, cart, checkout, standard orders
- [x] Custom stitching request flow (submission + status tracking)
- [x] Admin dashboard: order management, stitching queue, product management
- [x] Super Admin user management
- [x] Vendor dashboard: product links, commission balance, payout requests

## 8. Open questions — three of seven block the schema

Still unanswered, but **none of them block UI work** — the build runs on a
working default for each, and anything needing a real backend shows a "coming
soon" state instead of waiting.

Only three change the database structure: who fulfils stitching, the vendor
payout method, and the payment methods. They're marked **⚠️ DECISION** in
[SCHEMA.md](./SCHEMA.md); the rest of the tables can be built without them.

| Question | What the UI assumes today | Where |
|---|---|---|
| Payment methods beyond card + COD (bank transfer, JazzCash/Easypaisa)? | COD only completes an order | `checkout/page.tsx` |
| Commission: flat vs. percentage, varies by product/vendor? | Either, set per vendor by a Super Admin | `lib/commission.ts` |
| Vendor link model: per-product link or one referral code? | Both — one code per vendor, carried on per-product links | `lib/local/affiliate.ts` |
| Attribution window and first- vs. last-touch? | 30 days, last touch wins | `lib/local/referral.ts` |
| Payout method and minimum threshold? | PKR 5,000 minimum, monthly | `lib/local/payouts.ts` |
| Who fulfills stitching operationally? | In-house Master Stitchers | `data/stitchers.ts` |
| Final hosting/domain and brand assets? | Placeholder palette/fonts; images on `lh3.googleusercontent.com` | `data/products.ts` |

## Not built — deferred to the backend

These are known gaps, deliberately left because building them twice costs
more than building them once against real APIs:

- Reference-image upload for stitching requests (needs object storage)
- Unified catalog filtering by size and colour
- Review display and submission on the PDP (`Product` carries `rating` and
  `reviewCount`, but nothing renders a review list)
- Reports and analytics beyond the two dashboard charts
- Real click/sale attribution and commission accrual
- One dead placeholder link remains: `href="#"` in
  [InstagramGallery.tsx:33](src/components/home/InstagramGallery.tsx#L33).
  Needs the real Instagram URL, or removal — a link that goes nowhere is the
  one thing the "coming soon" convention exists to avoid.

## Suggested next steps

1. Keep polishing the UI. The deferred items above are the remaining surface,
   and each can ship with a "coming soon" state until the backend exists.
2. **Review [SCHEMA.md](./SCHEMA.md)** — tables 1–4 (users, products, orders,
   stitching) are unblocked today and cover most of the app.
3. Build API routes and swap the `src/lib/local/` modules for API clients.
   Each is a single file with no `localStorage` calls leaking into
   components, so this is a per-module change, not a rewrite.
4. Re-validate every payload server-side. The client-side validation in this
   build is UX, not a security boundary.

> ⚠️ **Flagged during schema work: Stripe does not operate in Pakistan.** It
> cannot onboard a Pakistan-registered business, so the earlier Stripe
> integration could never have gone live. Worth verifying independently, but
> plan on a local provider — **Safepay** or **PayFast** both handle PKR cards
> and bundle JazzCash/Easypaisa. Nothing to do while card is "coming soon";
> it matters the moment payments become real.
