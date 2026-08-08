-- FUJRS — role permissions and payout requests. See SCHEMA.md §6 and §9.
--
-- Both back UI that already exists (the Super Admin "Access" tab, and the
-- vendor payout flow). Neither is blocked by an open question: only the payout
-- DESTINATION (bank vs mobile wallet) needs a decision, and that lives in a
-- later payout_methods migration.

-- ---------------------------------------------------------------------------
-- role_permissions
-- ---------------------------------------------------------------------------
-- REQUIREMENTS.md §4.2 asks for per-user permissions via Permission and
-- UserPermission tables. The built UI does role x category instead
-- (SuperAdminView.tsx), which is the recommendation in SCHEMA.md §9: for a
-- five-role app, per-user permissions are a large surface solving a problem
-- that hasn't appeared.
--
-- If per-user is ever needed the migration is additive — a user_permissions
-- table overriding this one, resolved user-first-then-role. Nothing here
-- changes.

create type access_category as enum
  ('PRODUCTS', 'ORDERS', 'STITCHING', 'VENDORS', 'REPORTS');

create table role_permissions (
  role     app_role not null,
  category access_category not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (role, category)
);

comment on table role_permissions is
  'Role x category access grid backing the Super Admin Access tab.';

-- Seeded least-privilege, NOT with the UI's placeholder defaults.
--
-- SuperAdminView.tsx currently initialises every role to true for every
-- category. That is a UI placeholder, and shipping it as the database default
-- would let a VENDOR read all orders and every other vendor's numbers. The
-- seed below reflects what each role actually needs; a Super Admin can widen
-- it from the dashboard.
--
-- SUPER_ADMIN is deliberately absent: it bypasses this table entirely rather
-- than relying on rows that could be edited away.

insert into role_permissions (role, category, can_view, can_edit) values
  -- Admin: day-to-day running of the store.
  ('ADMIN',  'PRODUCTS',  true,  true),
  ('ADMIN',  'ORDERS',    true,  true),
  ('ADMIN',  'STITCHING', true,  true),
  ('ADMIN',  'VENDORS',   true,  false),
  ('ADMIN',  'REPORTS',   true,  false),

  -- Vendor: their own links and earnings only. No orders, no catalogue edits.
  ('VENDOR', 'PRODUCTS',  true,  false),
  ('VENDOR', 'ORDERS',    false, false),
  ('VENDOR', 'STITCHING', false, false),
  ('VENDOR', 'VENDORS',   false, false),
  ('VENDOR', 'REPORTS',   false, false),

  -- Tailor: the stitching queue, nothing else.
  ('TAILOR', 'PRODUCTS',  false, false),
  ('TAILOR', 'ORDERS',    false, false),
  ('TAILOR', 'STITCHING', true,  true),
  ('TAILOR', 'VENDORS',   false, false),
  ('TAILOR', 'REPORTS',   false, false),

  -- Customer has no dashboard access at all.
  ('CUSTOMER', 'PRODUCTS',  false, false),
  ('CUSTOMER', 'ORDERS',    false, false),
  ('CUSTOMER', 'STITCHING', false, false),
  ('CUSTOMER', 'VENDORS',   false, false),
  ('CUSTOMER', 'REPORTS',   false, false);

-- ---------------------------------------------------------------------------
-- payout_requests
-- ---------------------------------------------------------------------------
-- Backs src/lib/local/payouts.ts.
--
-- method_id is added by the payout_methods migration once the bank-vs-wallet
-- decision lands — a request can be raised before a destination is on file,
-- which is what the current UI does.
--
-- NOTE: there is deliberately no balance column anywhere. The available
-- balance is DERIVED (credited commission minus open and paid requests), the
-- way availableToRequest() computes it. A stored balance drifts the first time
-- a write fails halfway, and then the vendor's money is wrong.

create type payout_status as enum
  ('REQUESTED', 'PROCESSING', 'PAID', 'REJECTED');

create table payout_requests (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references users(id) on delete cascade,
  amount_paisa bigint not null check (amount_paisa > 0),
  status       payout_status not null default 'REQUESTED',

  -- Bank or wallet transaction reference, once actually paid.
  reference    text,
  note         text,

  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references users(id) on delete set null
);

create index payout_requests_vendor_idx
  on payout_requests (vendor_id, requested_at desc);
create index payout_requests_open_idx
  on payout_requests (status) where status in ('REQUESTED', 'PROCESSING');

-- ---------------------------------------------------------------------------
-- RLS — required, per the warning at the end of the rls migration
-- ---------------------------------------------------------------------------
-- Any table added after that migration starts with RLS DISABLED. Enabling it
-- is manual, and forgetting it is the most likely way to leak this database.

alter table role_permissions enable row level security;
alter table payout_requests enable row level security;

-- Every signed-in user may read the grid — the dashboard needs it to decide
-- what to render. Only a Super Admin may change it.
create policy role_permissions_read on role_permissions
  for select using (auth.uid() is not null);

create policy role_permissions_write on role_permissions
  for all using (is_super_admin()) with check (is_super_admin());

-- A vendor sees only their own requests, never another vendor's.
create policy payout_requests_own_read on payout_requests
  for select using (vendor_id = auth.uid());

create policy payout_requests_own_insert on payout_requests
  for insert with check (
    vendor_id = auth.uid()
    and status = 'REQUESTED'          -- can't self-approve into PAID
  );

create policy payout_requests_super_admin on payout_requests
  for all using (is_super_admin()) with check (is_super_admin());

-- Vendors must not edit a request after raising it — approval and payment are
-- the Super Admin's, so there is no vendor update policy.
--
-- The minimum-withdrawal rule and the "not more than available" check stay in
-- application code: both need to read commissions and other open requests,
-- which is a transaction, not a row predicate. Enforce them server-side —
-- the client checks in payouts.ts are UX only.
