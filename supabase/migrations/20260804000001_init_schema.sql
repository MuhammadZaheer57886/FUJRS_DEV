-- FUJRS — extensions, enums, users, addresses.
-- Rationale for every column is in SCHEMA.md §1.
--
-- Conventions used throughout every migration:
--   * snake_case in the database, translated to camelCase at the adapter
--     boundary (see CLAUDE.md) — raw rows never reach a component.
--   * money is integer paisa (bigint). Never float: 45000.1 + 350.2 is not
--     45350.3 in binary floating point, and money has to reconcile exactly.
--   * timestamptz everywhere, never naive timestamps.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive email

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type app_role as enum
  ('CUSTOMER', 'ADMIN', 'VENDOR', 'TAILOR', 'SUPER_ADMIN');

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
-- Distinct from Supabase's auth.users, which we don't own. This table holds
-- the application's view of a person: their role, and the vendor fields.
-- Link the two by id; keep them in step with a signup trigger.
--
-- `role` lives here rather than in a JWT claim on purpose: RLS policies read
-- it, and anything a client can influence is not access control.

create table users (
  id            uuid primary key default gen_random_uuid(),

  -- NULLABLE on purpose. A first-time visitor is signed in anonymously and has
  -- no email or name until they register, at which point both are filled in on
  -- the SAME row — see the auth_integration migration. Uniqueness is a partial
  -- index below, since many anonymous rows share a null email.
  email         citext,
  name          text,

  -- Mirrors auth.users.is_anonymous. Kept here so RLS policies and queries can
  -- filter on it without reaching into the auth schema.
  is_anonymous  boolean not null default false,

  role          app_role not null default 'CUSTOMER',

  -- Null when a managed auth provider owns credentials. If this is ever
  -- populated it holds an Argon2id/bcrypt digest — never a plaintext password.
  password_hash text,

  -- Path inside the `avatars` bucket (<user_id>/avatar.webp), not a full URL —
  -- same portability reasoning as product_images.storage_path.
  avatar_path   text,

  is_active     boolean not null default true,

  -- The Super Admin who created this account (REQUIREMENTS.md §2). Null for
  -- self-registered customers.
  created_by    uuid references users(id) on delete set null,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table users is
  'Application users, including anonymous guests. Deactivate via is_active — never delete, it would orphan order history.';

create index users_role_idx on users (role) where is_active;

-- Email is unique among users who HAVE one. A partial index rather than a
-- plain unique constraint, because every anonymous guest has a null email and
-- they must not collide with each other.
create unique index users_email_unique_idx on users (email)
  where email is not null;

-- Anonymous rows accumulate fast (one per first-time visitor). This index
-- supports the periodic cleanup described in BACKEND_SETUP.md §7.
create index users_anonymous_idx on users (created_at)
  where is_anonymous;

-- A registered user must have an email; an anonymous one must not.
alter table users add constraint users_anonymous_has_no_email
  check (
    (is_anonymous and email is null) or
    (not is_anonymous and email is not null)
  );

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
-- The UI saves one address per customer today, but people ship to more than
-- one place, so this is its own table from the start.
--
-- Note: orders COPY the address rather than referencing it (see the orders
-- migration). An order records where something was actually sent; if it
-- pointed here, editing an address would silently rewrite delivery history.

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  street      text not null,
  city        text not null,
  postal_code text not null,
  country     text not null default 'PK',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index addresses_user_idx on addresses (user_id);

-- At most one default per user, enforced by the database rather than trusted
-- to application code.
create unique index addresses_one_default_idx
  on addresses (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
-- A trigger rather than application code, so a row updated from psql, the
-- dashboard, or a future service still gets an accurate timestamp.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();
