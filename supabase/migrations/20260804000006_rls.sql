-- FUJRS — Row Level Security. See SCHEMA.md "Cross-cutting notes" and
-- BACKEND_SETUP.md §6.
--
-- READ THIS BEFORE CHANGING ANYTHING HERE.
--
-- The anon key ships to the browser. It is safe ONLY because these policies
-- decide what each request may read. With RLS off, that key reads the entire
-- database: every vendor's earnings, every customer's address, every payout
-- account.
--
-- A table with RLS disabled and a table with no policies are OPPOSITE things:
--   * RLS disabled  -> wide open
--   * RLS enabled, no policy -> closed to everyone (except service_role)
-- The service_role key bypasses all of this, which is exactly why it must
-- never reach the browser.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so a policy can read users.role without recursing through
-- the users policies. search_path is pinned — an unpinned search_path on a
-- SECURITY DEFINER function is a privilege-escalation hole.

create or replace function current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('ADMIN', 'SUPER_ADMIN') from users where id = auth.uid()),
    false
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'SUPER_ADMIN' from users where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

alter table users enable row level security;

create policy users_read_self on users
  for select using (id = auth.uid());

create policy users_read_all_staff on users
  for select using (is_staff());

create policy users_update_self on users
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Only a Super Admin creates or modifies staff accounts (REQUIREMENTS.md §2).
create policy users_write_super_admin on users
  for all using (is_super_admin()) with check (is_super_admin());

-- NOTE: users_update_self lets a user edit their own row, which includes
-- `role` and `commission_value`. Postgres RLS cannot restrict WHICH columns a
-- policy allows. Enforce column-level rules in the adapter, or revoke the
-- column grants:
--   revoke update (role, commission_type, commission_value, is_active)
--     on users from authenticated;
revoke update (role, commission_type, commission_value, is_active)
  on users from authenticated;

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------

alter table addresses enable row level security;

create policy addresses_own on addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy addresses_read_staff on addresses
  for select using (is_staff());

-- ---------------------------------------------------------------------------
-- products — public read, staff write
-- ---------------------------------------------------------------------------

alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;

create policy products_public_read on products
  for select using (archived_at is null);

create policy products_staff_read_all on products
  for select using (is_staff());

create policy products_staff_write on products
  for all using (is_staff()) with check (is_staff());

create policy product_images_public_read on product_images
  for select using (true);
create policy product_images_staff_write on product_images
  for all using (is_staff()) with check (is_staff());

create policy product_variants_public_read on product_variants
  for select using (true);
create policy product_variants_staff_write on product_variants
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_events enable row level security;

create policy orders_own_read on orders
  for select using (user_id = auth.uid());

create policy orders_staff_read on orders
  for select using (is_staff());

-- Status changes are staff-only. Customers never move their own order.
create policy orders_staff_update on orders
  for update using (is_staff()) with check (is_staff());

create policy order_items_own_read on order_items
  for select using (
    exists (select 1 from orders o
             where o.id = order_items.order_id
               and (o.user_id = auth.uid() or is_staff()))
  );

create policy order_status_events_read on order_status_events
  for select using (
    exists (select 1 from orders o
             where o.id = order_status_events.order_id
               and (o.user_id = auth.uid() or is_staff()))
  );

-- Order creation goes through the server (it has to write orders, items and
-- commission atomically), so there is deliberately no client insert policy.

-- ---------------------------------------------------------------------------
-- stitching
-- ---------------------------------------------------------------------------

alter table stitching_requests enable row level security;
alter table stitching_reference_images enable row level security;

create policy stitching_own on stitching_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A tailor sees ONLY what is assigned to them — not the whole queue.
create policy stitching_assigned_tailor on stitching_requests
  for select using (assigned_tailor_id = auth.uid());

create policy stitching_tailor_update on stitching_requests
  for update using (assigned_tailor_id = auth.uid())
  with check (assigned_tailor_id = auth.uid());

create policy stitching_staff on stitching_requests
  for all using (is_staff()) with check (is_staff());

create policy stitching_images_read on stitching_reference_images
  for select using (
    exists (select 1 from stitching_requests r
             where r.id = stitching_reference_images.stitching_request_id
               and (r.user_id = auth.uid()
                    or r.assigned_tailor_id = auth.uid()
                    or is_staff()))
  );

-- ---------------------------------------------------------------------------
-- affiliate — a vendor must never see another vendor's numbers
-- ---------------------------------------------------------------------------

alter table affiliate_links enable row level security;
alter table referral_clicks enable row level security;
alter table commissions enable row level security;

create policy affiliate_links_own on affiliate_links
  for all using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());

create policy affiliate_links_staff on affiliate_links
  for select using (is_staff());

-- referral_clicks has NO client policy at all. Writes happen server-side with
-- the service role; a client that could insert here could fabricate clicks,
-- and one that could read here could see another vendor's traffic.
create policy referral_clicks_super_admin on referral_clicks
  for select using (is_super_admin());

create policy commissions_own_read on commissions
  for select using (vendor_id = auth.uid());

create policy commissions_staff_read on commissions
  for select using (is_staff());

-- Commission rows are written by the server only — a vendor writing their own
-- commission is the obvious attack.

-- ---------------------------------------------------------------------------
-- Verify before trusting any of this
-- ---------------------------------------------------------------------------
-- Assume nothing here works until you have checked it. With the ANON key and
-- no session, each of these must return zero rows:
--
--   select * from orders;
--   select * from commissions;
--   select * from users;
--   select * from referral_clicks;
--
-- And signed in as a vendor, this must return only that vendor's rows:
--
--   select * from commissions;
--
-- Any table added later starts with RLS DISABLED. Enabling it is a manual
-- step, and forgetting it is the single most likely way to leak this database.
