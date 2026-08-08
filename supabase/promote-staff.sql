-- FUJRS — promote a signed-up account to a staff role.
--
-- Run this in the Supabase SQL editor (or psql) AFTER the person has
-- registered through /register. Sign-up always creates a CUSTOMER: the signup
-- trigger hard-codes the role and never reads one from user metadata, because
-- metadata is client-writable and a self-assigned SUPER_ADMIN would otherwise
-- be one signup away.
--
-- That is why the first Super Admin has to be made here. There is deliberately
-- no in-app path to it.
--
-- ---------------------------------------------------------------------------
-- GETTING THE ACCOUNT CREATED
-- ---------------------------------------------------------------------------
-- Registering through /register sends a confirmation email, and Supabase's
-- built-in email service allows only a couple per hour — so repeated attempts
-- fail with HTTP 429 "email rate limit exceeded". That is a project setting,
-- not an application error.
--
-- Two ways round it:
--
--   A. Create the account from the dashboard (works immediately, sends no
--      email): Authentication -> Users -> Add user. Tick "Auto Confirm User",
--      set the email and password, then run the promotion below.
--
--   B. Stop sending confirmation emails at all: Authentication -> Providers ->
--      Email -> turn "Confirm email" OFF. /register then works normally.
--      Production wants custom SMTP instead of the built-in sender.
--
-- Either way the signup trigger creates the public.users row as CUSTOMER, and
-- the promotion below is what makes it staff.

-- 1. Who has registered so far.
select id, email, name, role, is_anonymous, created_at
  from users
 order by created_at desc
 limit 20;

-- 2. Promote. Change the email, then run.
update users
   set role = 'SUPER_ADMIN'
 where email = 'superadmin@fujrs.com';

update users
   set role = 'ADMIN'
 where email = 'admin@fujrs.com';

-- 3. Confirm it took.
select email, role from users where role in ('ADMIN', 'SUPER_ADMIN');

-- ---------------------------------------------------------------------------
-- Note on the other roles
-- ---------------------------------------------------------------------------
-- VENDOR also needs a referral code and a commission rate before the vendor
-- dashboard shows anything meaningful:
--
--   update users
--      set role = 'VENDOR',
--          referral_code = 'FJ-XXXXXX',   -- must match ^FJ-[0-9A-Z]{6}$
--          commission_type = 'PERCENT',
--          commission_value = 12
--    where email = 'vendor@example.com';
--
-- TAILOR needs no extra fields; stitching requests are assigned to them by id.
