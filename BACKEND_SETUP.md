# FUJRS — Backend Setup (Supabase)

How to stand up the database, wire it to the finished UI, and keep it
swappable. Tables and column rationale live in [SCHEMA.md](./SCHEMA.md); this
doc is the mechanics.

**Status: connected.** Every migration is applied to the linked project, all
thirteen stores have Supabase adapters, and `NEXT_PUBLIC_DATA_BACKEND=supabase`
is live. The `local` adapter is kept working on purpose — it is what lets the
app be demoed with no database, and the fallback if Supabase is unreachable
during development.

What is deliberately NOT built: card payments (Cash on Delivery is the only
method that completes an order) and promo codes. Both show a "coming soon"
state rather than a dead control.

---

## The one decision that mattered most — already taken

> **Make the data layer `async` before connecting Supabase, not during.**

The stores used to be synchronous: `listOrders()` returned an array
immediately. Supabase returns promises. Swapping storage and changing the call
signature in the same step would have changed every reading component
**twice** — once to await, once to handle loading and error states.

So it was done in two passes:

1. **Done.** Every store method is `async`, still backed by `localStorage`.
   Components changed once; the app behaves identically.
2. **Next.** Swap the adapter. **Zero component changes.**

Keep it that way: a new store method is async from the start, even if the
local implementation returns instantly.

---

## 1. Architecture — ports and adapters

The requirement is that moving off Supabase later is cheap. That means
**nothing outside the data layer may know Supabase exists** — no imports, no
`PostgrestError`, no `.from("orders")` in a component.

```
src/lib/
  *.ts               pure rules, no I/O: orderStatus, commission,
                     measurements, referral, payouts
  data/
    types.ts         domain shapes (Order, CartLine, CatalogItem…)
    ports.ts         the interfaces — the contract
    local/           localStorage adapter — DONE
      storage.ts     the only localStorage in the app
    static/          the shipped catalogue, mapped to CatalogItem
    supabase/        Supabase adapter — DONE
    index.ts         picks one, exports it
    server.ts        the server-component entry point
```

A port is an ordinary TypeScript interface:

```ts
// src/lib/data/ports.ts
import type { Order, NewOrderInput } from "./types";
import type { OrderStatus } from "@/lib/orderStatus";

export interface OrderStore {
  list(userId?: string): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(input: NewOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
```

One file chooses the implementation:

```ts
// src/lib/data/index.ts
import type { OrderStore } from "./ports";
import { localOrders } from "./local/orders";
import { supabaseOrders } from "./supabase/orders";

const useSupabase = process.env.NEXT_PUBLIC_DATA_BACKEND === "supabase";

export const orders: OrderStore = useSupabase ? supabaseOrders : localOrders;
```

Components import `{ orders } from "@/lib/data"` and never learn which is
running. Swapping to a custom REST or GraphQL backend later means writing
`data/http/orders.ts` against the same interface — **no component changes at
all**. Keeping the `local` adapter alive is also what lets the demo keep
working without a database, which is worth preserving.

### The rules that make this hold

1. **No Supabase import outside `src/lib/data/supabase/`.** Worth enforcing:

   ```js
   // eslint.config.mjs — no-restricted-imports
   { patterns: [{ group: ["@supabase/*"],
                  message: "Supabase belongs in src/lib/data/supabase/ only." }] }
   ```

2. **Translate at the boundary.** The database is `snake_case`, the app is
   `camelCase` ([CLAUDE.md](./CLAUDE.md)). Adapters map row → domain object.
   A raw row must never reach a component.

3. **Adapters throw domain errors, not driver errors.** A component should
   never see a `PostgrestError`. Catch it, throw something meaningful — the
   pattern `CatalogStorageError` already uses.

4. **Domain rules stay pure.** `canTransition`, `calculateCommission`,
   `validatePayout` do no I/O and must not start.

### Status: done

All thirteen stores now sit behind ports in `src/lib/data/`, every method is
`async`, and `src/lib/data/local/storage.ts` is the only file in the app that
touches `localStorage`. The three providers that held storage inline
(Cart, Wishlist, Tailoring) keep their exact public API — only the storage
moved out.

Pure rules were split out at the same time: `src/lib/referral.ts` and
`src/lib/payouts.ts` hold the code format, attribution window, minimum
withdrawal and validation, with no I/O. `src/lib/useAsync.ts` handles the
load/cancel boilerplate, including ignoring a slow first request that would
otherwise overwrite a newer one.

Both adapter sets are complete. Adding a custom REST backend later means
writing `data/http/` against these same interfaces — no component changes.

---

## 2. Install the CLI

```bash
brew install supabase/tap/supabase     # macOS
supabase --version
```

Not on macOS, or want it project-local: `npx supabase <command>` works for
everything below. Docker Desktop must be running for the local stack.

> The CLI changes fairly often. If a command below doesn't match, check
> `supabase <command> --help` rather than guessing.

---

## 3. Create the project

Two routes. Either is fine.

**Dashboard:** create the project at supabase.com, then copy its **reference
ID** from Project Settings → General.

**CLI:**

```bash
supabase login
supabase projects create fujrs --org-id <your-org-id> --region ap-south-1
```

`ap-south-1` (Mumbai) is the closest region to Pakistan — worth choosing
deliberately, since it's fixed after creation and directly affects latency for
your customers.

Then, in the repo:

```bash
supabase init          # creates supabase/config.toml
supabase link --project-ref <ref>
```

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

`.env.local` is already gitignored (`.env*.local`). **Never commit real keys.**

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser client key |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Server-only admin key |
| `NEXT_PUBLIC_DATA_BACKEND` | yes | `local` or `supabase` |
| `DISCORD_NEW_USERS_WEBHOOK_URL` | **NO** | Server-only Discord webhook for guest and account events |
| `DISCORD_ORDERS_WEBHOOK_URL` | **NO** | Server-only Discord webhook for order and status events |

Discord notifications are best-effort operational alerts. They are sent only
from server routes, never from the browser, and a Discord outage does not fail
an order or status update. Keep both webhook URLs private and rotate them if
they are ever exposed.

### About the two keys — read this properly

[CLAUDE.md](./CLAUDE.md) says credentials never belong in a `NEXT_PUBLIC_*`
var. Supabase is the one deliberate exception, and only under a specific
condition:

- **Anon key** is *designed* to ship to the browser. It carries no authority on
  its own. It is safe **only because Row Level Security decides what each
  request may read.** With RLS off, that key reads your whole database. It is
  not a secret, but it is only harmless when §6 is done.

- **Service role key bypasses RLS entirely.** It must never appear in a
  `NEXT_PUBLIC_*` var, in client code, in a component, or in a git commit. It
  belongs in server-side code only — route handlers, server actions, server
  components. If it ever leaks, rotate it immediately in the dashboard; it is a
  full database credential.

The `NEXT_PUBLIC_` prefix is not advice — Next.js inlines those values into the
JavaScript bundle at build time. Anything carrying it is public, permanently,
to anyone who opens devtools.

---

## 5. Migrations

Never edit the database by hand in the dashboard. Every change is a migration
file in git, so any environment can be rebuilt from scratch.

```bash
supabase migration new init_schema      # creates supabase/migrations/<ts>_init_schema.sql
```

Write the DDL from [SCHEMA.md](./SCHEMA.md), then:

```bash
supabase start        # local Postgres in Docker
supabase db reset     # wipe + replay every migration — do this often
```

`db reset` locally is how you find out a migration doesn't apply cleanly
*before* it reaches the shared database.

When it's right:

```bash
supabase db push      # apply to the linked remote
```

Suggested order, from SCHEMA.md §"Suggested build order":

All ten are applied to the linked project:

| Migration | Tables | Status |
|---|---|---|
| `init_schema` | extensions, enums, `users`, `addresses` | written |
| `products` | `products`, `product_images`, `product_variants` | written |
| `orders` | `orders`, `order_items`, `order_status_events` | written |
| `stitching` | `stitching_requests`, `stitching_reference_images` | written |
| `affiliate` | `affiliate_links`, `referral_clicks`, `commissions` | written |
| `rls` | policies for everything above | written |
| `permissions_payouts` | `role_permissions`, `payout_requests` | written |
| `auth_integration` | `auth.users` → `public.users` triggers, anonymous guests | written |
| `cart_wishlist` | `cart_items`, `wishlist_items` | written |
| `storage` | three buckets + object access policies | written |
| `payments` | `payments` | ⚠️ needs the provider decision |
| `payout_methods` | `payout_methods` + `payout_requests.method_id` | ⚠️ needs the bank-vs-wallet decision |
| `reviews` | `reviews` | deferred — no UI renders reviews yet |

**Applied 4 Aug 2026.** To rebuild from scratch or verify locally, run
`supabase start && supabase db reset`, which replays every migration
against a local Postgres.

`workshops` (SCHEMA.md §4) is intentionally absent: it only exists if stitching
is outsourced. Don't create it speculatively.

### Generated types

```bash
supabase gen types typescript --local > src/lib/data/supabase/database.types.ts
```

Regenerate after every migration. These types are for **adapters only** — they
describe database rows, not domain objects, and importing them into a component
breaks the whole point of §1.

---

## 6. Row Level Security — not optional

The anon key is in the browser. Without RLS, any visitor can read every table:
every vendor's earnings, every customer's address, every payout account.

**Enable RLS on every table.** A table with RLS off and a policy-less table are
opposite things — the first is wide open, the second is closed.

```sql
alter table orders enable row level security;

-- A customer sees only their own orders.
create policy "own orders" on orders
  for select using (auth.uid() = user_id);

-- Staff see all of them.
create policy "staff read orders" on orders
  for select using (
    exists (select 1 from users u
            where u.id = auth.uid()
              and u.role in ('ADMIN','SUPER_ADMIN'))
  );
```

Minimum policy set:

| Table | Rule |
|---|---|
| `orders`, `addresses` | owner reads own; Admin/Super Admin read all |
| `commissions`, `payout_requests` | vendor reads **own only**; Super Admin all |
| `payout_methods` | vendor reads own; Super Admin only across vendors — financial PII |
| `stitching_requests` | customer reads own; tailor reads assigned only |
| `products` | public read where `archived_at is null`; staff write |
| `referral_clicks` | **no client read at all** — server-side insert only |

Verify by querying with the anon key as an unauthenticated user and confirming
you get nothing back. Assume nothing here — test it.

---

## 7. Auth

`src/lib/auth/session.ts` is a `localStorage` stand-in with no passwords, by
design. Supabase Auth replaces it, and the same swap rule applies: session
access goes behind a port so a future custom backend can provide its own.

Two things that bite:

- **`auth.users` and your `users` table are different tables.** Supabase owns
  `auth.users`. Your `public.users` row holds `role`, `name`, commission
  fields. The `auth_integration` migration keeps them in step with triggers.
- **Role must live in the database, never the JWT alone.** RLS policies read
  `public.users.role`. A role claim a client can influence is not access
  control. The signup trigger hard-codes `CUSTOMER` and never reads a role out
  of user metadata — otherwise a self-assigned `SUPER_ADMIN` is one signup away.

The five demo accounts in `roles.ts` should stay working while
`NEXT_PUBLIC_DATA_BACKEND=local`, so the UI stays demoable without a database.

### Anonymous guests

Every first-time visitor is signed in anonymously on arrival:

```ts
await supabase.auth.signInAnonymously();
```

They get a real `auth.users` row with `is_anonymous = true` and a real uuid.
That uuid owns their cart, wishlist, measurements, and a guest-checkout order —
all RLS-scoped through `auth.uid()` exactly like a registered user.

**Registering updates that same row.** The email is set, `is_anonymous` flips
to false, and **the uuid does not change**:

```ts
await supabase.auth.updateUser({ email, password });
```

That stability is the entire point. Everything the guest did is already theirs,
so there is no cart-merge step on signup — which is where guest-to-user
conversion normally goes wrong and quietly drops the bag.

Enable it under **Authentication → Providers → Anonymous sign-ins** in the
dashboard, or `[auth] enable_anonymous_sign_ins = true` in `config.toml`.

Four things to get right:

- **It is unauthenticated user creation.** Anyone can call it in a loop and
  fill `auth.users`. Turn on CAPTCHA (Authentication → Settings → Bot and Abuse
  Protection) before going live, and rate-limit at the edge.
- **Clean them up.** Abandoned guest rows accumulate forever. Schedule a job to
  delete anonymous users with no cart and no order after ~30 days; there's an
  index on `users(created_at) where is_anonymous` for it.
- **Anonymous is not second-class.** Guests browse, hold a cart, and check out —
  don't gate those. Use `is_anonymous_user()` only where a durable account is
  genuinely required, e.g. leaving a review.
- **A guest can never be staff.** Enforced three ways: the trigger hard-codes
  the role, RLS revokes the `role` column from `authenticated`, and a check
  constraint holds regardless of how the row was written.

### Email is not the identity key

`src/lib/local/profile.ts` keys accounts by email, which is fine for a browser
store. In the database the key is `users.id`, and **an anonymous user has no
email at all** — that's why `users.email` is nullable with a partial unique
index. Adapters must key on id, not email.

---

## 8. Order of work

1. ~~Extract the three contexts into the data layer~~ — done (§1)
2. ~~Make every store `async`, still on `localStorage`~~ — done
3. ~~Create the project, link it, fill `.env.local`~~ — done
4. ~~`db reset` until migrations 1–10 apply cleanly, then `db push`~~ — done
5. ~~Write RLS policies and verify with the anon key~~ — written; verify
6. ~~Build Supabase adapters against the existing ports~~ — **done. All
   eleven stores have both implementations** (§"The stores", below)
7. Flip `NEXT_PUBLIC_DATA_BACKEND=supabase` in one environment and test
8. Re-validate every payload server-side

### The catalogue read path (step 6, done)

The storefront reads products through the data layer, not the static array.
That needs two entry points, for one reason:

```
@/lib/data          browser — dashboard, cart, vendor links
@/lib/data/server   server components — /women, /men, /new-arrivals,
                    /search, /cart, /wishlist, /products/[slug]
```

`local` is `localStorage`, which does not exist on the server, so
`@/lib/data/server` picks between the `products` table and
`src/lib/data/static/catalog.ts` — the static array mapped to `CatalogItem`
at the boundary, exactly like a database row. The pages are identical either
way and still never learn which backend is running.

Two consequences worth knowing:

- **A piece published from the dashboard appears in the shop immediately** on
  `supabase`. On `local` it stays in the browser that added it — the server
  cannot see a visitor's `localStorage`, which is what makes `local` the demo
  mode rather than a backend.
- **Catalogue reads use `createPublicSupabase()`**, which carries no cookies.
  Reading `cookies()` opts a route out of static rendering, so
  `/products/[slug]` would be re-rendered per request for content identical
  to every visitor. `products_public_read` is what makes that safe; never use
  that client for a user's own orders, addresses or earnings.

### Orders (step 6, done)

Reads go straight to Postgres — `orders_own_read` / `orders_staff_read` decide
whether you see your own or everyone's. **Writes do not.** There is
deliberately no client insert policy on `orders`, so `create` posts to
`POST /api/orders`, which is the first place in this build where step 8
actually happens. That route does not trust:

| From the browser | What the server does instead |
|---|---|
| line prices | re-reads `products.price_paisa` by slug; the bespoke line is re-priced from the caller's own `stitching_requests` draft via `bespokePrice()` |
| the stitching charge | uses `products.stitching_addon_paisa`, and refuses it on a product that isn't `stitching_eligible` |
| the totals | recomputes with `@/lib/pricing` — the same helper the bag uses — and rejects the order if the posted total has drifted |
| the referral code | shape-checks it, then confirms a VENDOR actually owns it; an unknown code is dropped, not credited |
| who the caller is | reads the verified session, never the payload |

Verified against the live project: posting `price: 1` for a PKR 45,000 suit
stores 45,000, and `FJ-ZZZZZZ` is dropped rather than credited. A bespoke line
posted as `price: 500, qty: 5` stored PKR 22,500 × 1 — the figure recomputed
from the customer's stored garment and style choices.

#### Bespoke lines

The style options and their prices live in `src/lib/tailoringOptions.ts`, which
is pure. They used to sit in `TailoringContext`, and a `"use client"` module
cannot be imported by a route handler — which is precisely why the bespoke line
was the one item in the bag the server had to price on trust. Moving them out
closed that: `bespokePrice()` is now the single definition, used by the
configurator to show a total and by the route to charge one.

Ordering a bespoke piece also stamps `stitching_requests.order_item_id` and
moves the request to IN_PROGRESS. That column going non-null is what separates
a draft somebody is still editing from a garment the atelier has to cut, and it
is what gives the Tailor dashboard something real to read. The link happens
after the stock reservation, so a rejected order leaves the draft intact and
the customer's measurements survive.

Two things this created:

- **`orders.order_number`** is now the reference shown everywhere. The UI used
  to slice the last 8 characters off the id; that id is a uuid, which is not
  something a customer can read back to you over the phone.
- **Anonymous sign-in is now required for guest checkout.** Every read policy
  on `orders` matches `user_id = auth.uid()`, so an order written with a null
  `user_id` would be invisible to the person who placed it — including on the
  confirmation screen. The adapter signs a signed-out shopper in anonymously
  first (§7). **Enable Authentication → Providers → Anonymous sign-ins**, or
  guest checkout fails loudly rather than writing an unreachable order.

### Stock movement

`reserve_order_stock(uuid)` in the `stock` migration takes the inventory. The
route's earlier `stock >= qty` read is advisory only — it can go stale between
reading it and writing the order. The function is what decides:

```sql
update products set stock = stock - qty
 where id = ... and stock >= qty;      -- 0 rows => reject the order
```

Postgres locks the row for that statement, so a second shopper evaluates the
condition against the first one's result. A function body is one transaction,
so a failure on line three rolls back lines one and two — an order never
half-reserves. Lines are processed in `product_id` order, or two concurrent
orders holding the same two products could deadlock on each other's locks.

Cancelling or refunding puts the stock back, inside the existing status
trigger rather than a second one, so it can't be skipped by writing the status
some other way. `CANCELLED -> REFUNDED` deliberately does not restock twice.

Verified against the live project: five simultaneous orders for one remaining
item produced **one sale and four rejections**, the four rolled back leaving no
order rows, and cancel-then-refund returned the stock exactly once.

The function is `security definer` and revoked from `anon`/`authenticated` —
stock is not something a browser may move.

### The stores

| Store | Tables | Notes |
|---|---|---|
| `auth` | `auth.users` + `users` | role read from `public.users`, never the JWT |
| `users` | `users` | Super Admin only, via `/api/admin/users` |
| `catalog` | `products`, `product_images`, `product_variants` | plus a server read path (above) |
| `orders` | `orders`, `order_items` | writes via `/api/orders` |
| `profiles` | `users`, `addresses`, `avatars` bucket | one default address, replaced not accumulated |
| `cart` | `cart_items` | prices joined live, never stored |
| `wishlist` | `wishlist_items` | slugs in, product ids stored |
| `tailoring` | `stitching_requests` | one open draft per user, `order_item_id is null` |
| `affiliate` | `affiliate_links` | `unique (vendor_id, product_id)` makes "refresh, don't duplicate" a database fact |
| `referrals` | `referral_clicks` + a cookie | writes via `/api/referrals/click` |
| `payouts` | `payout_requests`, `commissions` | balance derived, never stored |
| `stitching` | `stitching_requests` | the tailor queue: pool + claim |
| `stats` | `orders` | Admin/Super Admin overview, aggregated client-side |
| `permissions` | `role_permissions` | role × category grid, read by all, written by Super Admin |
| `reviews` | `reviews` | public read, durable accounts only to write |
| `messages` | `contact_messages`, `newsletter_subscribers` | insert-only from the client, staff read |

#### Reviews

Sketched in SCHEMA.md §8 and deliberately not built while nothing rendered
them. The PDP renders them now.

`products.rating` and `review_count` were always documented as counters
"recomputed from reviews when that table exists, never maintained by hand".
A trigger does that recomputation — recomputed from the rows rather than
incremented, because an incremental counter drifts the first time a delete is
missed and then every product card is quietly wrong.

Writing needs a **durable** account. `is_anonymous_user()` is the check §7
reserves for exactly this: a guest browses, buys and checks out, but a review
nobody can be held to is a review anyone can write in a loop. Verified live —
an anonymous session got `new row violates row-level security policy`.

**The seeded ratings were fiction and are gone.** 17 products carried figures
invented by the design tool (4.8 from 132 reviews, and so on) with no reviews
behind them. Once the PDP showed a real reviews section those numbers
contradicted it on the same page, so they were cleared from the live database,
from `src/data/products.ts`, and from the seed generator.

#### Commission becomes payable on a hold period

`credit_due_commissions()` moves PENDING → CREDITED once an order is more than
`COMMISSION_HOLD_DAYS` old and has not been cancelled or refunded. Without it
every vendor balance read zero: only CREDITED counts, and nothing promoted
anything.

**14 days is the returns window, not an independent number.**
/returns-exchanges promises "items must be returned within 14 days of
delivery", so the hold has to be at least that long or the promise and the
payout disagree.

It is counted **from delivery**, not from placement — the first version counted
from `placed_at`, so an order placed on the 1st and delivered on the 10th
credited on the 15th while the customer could still return it until the 24th.
Delivery time comes from `order_status_events`, which the transition trigger
already writes; no new column, because the audit trail is already the record of
when things happened.

Changing the number means changing three things together: `COMMISSION_HOLD_DAYS`,
the `hold_from_delivery` migration, and the copy on the returns page.

It runs daily under `pg_cron` at 02:17, scheduled inside a guard so a project
without the extension still gets the function and a notice rather than a failed
migration. Verified live: a 20-day-old confirmed order credited, a 3-day-old
one stayed PENDING, a 30-day-old **cancelled** one stayed PENDING, and a second
run credited nothing — it is idempotent.

#### The access grid is real

The Access tab wrote to component state and said so on screen. It now reads and
writes `role_permissions`, which is seeded **least-privilege** — the UI used to
initialise every role to `true` for every category, the opposite of what the
seed grants.

It shows View and Edit separately, because the table has both and collapsing
them would mean the screen could not express "can see orders, can't refund
them" — which is most of what a permission grid is for. Edit is disabled unless
View is on: editing something you cannot see is not a coherent grant, and the
adapters enforce that too rather than trusting the checkbox.

SUPER_ADMIN has no rows on purpose. It bypasses the grid entirely, so it cannot
lose access by someone editing a row.

#### Reference photos

Customers can attach photos to a bespoke request at `/tailoring/configure`, and
the assigned tailor sees them on the spec sheet. The bucket is **private** —
these are pictures of a customer — so URLs are signed with a 5-minute expiry
and re-signed on every read. The whole queue is signed in one call rather than
one call per garment.

The path convention `<user_id>/<request_id>/<uuid>.<ext>` is load-bearing: the
storage policies read those first two segments to decide that a customer sees
their own photos and a tailor sees only the request assigned to them.

#### The dashboards read real tables

All four used to render `demoData`. They now query, and `demoData` survives
only as the `local` backend's fixtures — which is what it was always for.

**The tailor queue needed a workflow, not just a query.** RLS let a tailor read
only work assigned to them, and nothing assigned anyone, so every queue was
empty. Unassigned ordered work is now a **pool**: any tailor sees it, claiming
it is an ordinary update, and the `WITH CHECK` on the claim policy stops one
tailor claiming for another or taking a job already held. Verified live — two
tailors both saw an unclaimed job; after the first claimed it the second saw
none and could not steal it.

**A vendor can now count their own clicks.** `referral_clicks` was
Super-Admin-read-only. That reasoning holds for an unscoped policy but not one
filtered to the caller, and without it the dashboard reported zero clicks
forever — a number that is always wrong teaches people to ignore the screen.
Writes stay server-only, which is the policy that actually matters.

**Two things the Super Admin still shows as `—`**: per-vendor clicks and
earnings across all vendors. Those rows are RLS-scoped to each vendor, so
reading them centrally needs a server route. An em dash until it exists, never
an invented number.

**Fixed while wiring this:** the vendor dashboard derived its referral code
from a hash of the vendor's email, while the order route credits a sale by
matching `users.referral_code`. Those do not agree, so every link a vendor
copied would have credited nobody. The issued code is now carried through
`performance()`, and a vendor with no code issued sees a warning rather than a
broken link.

#### Identity

Every one of these resolves "me" from `getUser()`, which verifies the token
with the auth server — never from an argument. That is why `ProfileStore`,
`AffiliateStore` and `PayoutStore` no longer take an email: a component-supplied
email is a value the client controls, and an adapter that trusted one could be
asked for somebody else's address. `src/lib/data/supabase/identity.ts` holds
the three helpers, including `ensureUserId()`, which signs a guest in
anonymously so their bag, wishlist and bespoke draft belong to a real uuid.

#### Attribution is now real

`POST /api/referrals/click` records a `referral_clicks` row with the service
role — the table has no client policy at all, because a browser that could
insert here could fabricate traffic. It validates the code against a real
VENDOR, hashes the IP (salted; a raw address is personal data and only
deduplication needs it), and sets the cookie the order route reads.

**The order route takes the referral from that cookie, not from the payload.**
Verified live: with a cookie for `FJ-TEST01` and a body claiming `FJ-ZZZZZZ`,
the order credited `FJ-TEST01`.

Placing a referred order writes a `commissions` row at status PENDING, with the
rate COPIED rather than looked up — changing a vendor's rate must never rewrite
what they already earned. Refunding reverses it via the existing clawback
trigger. Verified live: a PKR 45,000 sale at 10% wrote PENDING / PKR 4,500, and
refunding moved it to REVERSED.

`availableToRequest()` counts only CREDITED and PAID commission. PENDING is
excluded on purpose: the dashboard promises a sale counts once the return
window has closed, and paying out on a sale that can still come back is how the
programme loses money. **Nothing yet moves PENDING → CREDITED** — that needs
the return window defined (REQUIREMENTS.md §8), so vendor balances read zero
until it exists.

### Seeding the catalogue

The 18 static products are not in the database until you put them there:

```bash
node --experimental-strip-types scripts/generate-seed.mjs   # → supabase/seed.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql                # remote
# or, locally: supabase db reset (seed.sql runs automatically)
```

It is idempotent — ids are derived from the slug, so re-running updates rows
rather than duplicating them. Until it runs, the shop shows only what has
been published from the dashboard.

Step 8 is not optional. Every check in the UI today — commission bounds, payout
minimums, status transitions, measurement completeness — is UX. A client can
send any payload it likes, and RLS controls *rows*, not whether a value is
sane.

---

## 9. If you leave Supabase later

Because of §1, the work is bounded:

1. Write `src/lib/data/http/` implementing the same ports.
2. Point `src/lib/data/index.ts` at it.
3. Port the schema — the migrations are plain Postgres, not Supabase-specific.
4. Replace Supabase Auth behind the session port.
5. Re-implement RLS as server-side authorisation.

No component changes. Steps 4 and 5 are the real work, which is why both sit
behind their own boundary rather than being sprinkled through the app.
