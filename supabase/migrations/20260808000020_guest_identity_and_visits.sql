-- FUJRS — commission belongs to vendors only, and users record where they
-- were last seen.
--
-- Two unrelated-looking fixes land together because both are about the same
-- thing: a `users` row saying something true about the person it describes.

-- ---------------------------------------------------------------------------
-- 1. Commission is a VENDOR fact, not a user fact
-- ---------------------------------------------------------------------------
-- The affiliate migration added these columns with `default 'PERCENT'` and
-- `default 10`. Defaults apply to every insert, so the signup trigger has been
-- stamping "10% commission" onto every customer — and onto every anonymous
-- guest — since the day it shipped. The Super Admin's user table then read
-- those columns back and displayed a rate for people who are not in the
-- affiliate programme at all.
--
-- Nothing PAID out wrongly: commission rows copy the rate at sale time and are
-- only ever written for a referring vendor. The damage was confined to what the
-- dashboard showed. But a column that is populated for rows it is meaningless
-- on is a bug waiting to become a payout one, so it is fixed at the source.

alter table users
  alter column commission_type  drop default,
  alter column commission_value drop default;

-- Clear the rate that the defaults wrote onto everyone who is not a vendor.
update users
   set commission_type  = null,
       commission_value = null
 where role <> 'VENDOR'
   and (commission_type is not null or commission_value is not null);

-- And make it impossible to reintroduce. Without this, the next code path that
-- forgets the `role = 'VENDOR'` guard silently recreates the same mess.
alter table users add constraint users_commission_vendor_only
  check (
    role = 'VENDOR'
    or (commission_type is null and commission_value is null)
  );

comment on column users.commission_value is
  'Vendors only — null on every other role, enforced by users_commission_vendor_only. Set by a Super Admin; commissions.rate_value snapshots it at sale time.';

-- ---------------------------------------------------------------------------
-- 2. Last seen: where a shopper visited from, and on what
-- ---------------------------------------------------------------------------
-- Denormalised onto `users` rather than kept as a visit log. The Super Admin
-- screen asks one question — "who is this person and when were they last
-- here?" — and a history table would mean a per-row subquery to answer it,
-- plus unbounded growth for data nobody reads twice. If a real audit trail is
-- ever needed it can be added alongside; these columns stay the fast answer.
--
-- No raw IP is stored. The city and country come from the CDN's geo headers,
-- which are already derived; keeping the address that produced them would be
-- collecting personal data for no use (same reasoning as referral_clicks.ip_hash).

alter table users
  add column last_seen_at      timestamptz,
  add column last_seen_city    text,
  add column last_seen_country text,   -- ISO 3166-1 alpha-2
  add column last_seen_browser text,
  add column last_seen_os      text,
  add column last_seen_device  text;   -- 'Desktop' | 'Mobile' | 'Tablet'

comment on column users.last_seen_at is
  'Server-stamped on each visit by /api/visits. Never written by the client — the update grant is revoked below.';

-- These are a server-side observation about a request. `users_update_self`
-- lets a user write their own row, and RLS cannot restrict which columns, so
-- without this revoke any shopper could POST themselves a fictional location
-- and the Super Admin screen would report it as fact. Same pattern as the
-- revoke on role/commission in the rls migration.
revoke update (
  last_seen_at, last_seen_city, last_seen_country,
  last_seen_browser, last_seen_os, last_seen_device
) on users from authenticated;

-- Sorting the Super Admin list by recency, and finding stale anonymous rows
-- for the cleanup in BACKEND_SETUP.md §7.
create index users_last_seen_idx on users (last_seen_at desc nulls last);
