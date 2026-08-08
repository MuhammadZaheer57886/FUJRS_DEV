-- FUJRS — Supabase Auth integration, including anonymous guests.
--
-- THE MODEL
--
--   1. A first-time visitor is signed in ANONYMOUSLY the moment they arrive
--      (supabase.auth.signInAnonymously()). They get a real row in auth.users
--      with is_anonymous = true, and a real uuid.
--   2. That uuid is their identity for cart, wishlist, measurements and even a
--      guest-checkout order — all RLS-scoped to auth.uid() like any other user.
--   3. When they register, Supabase UPDATES THE SAME auth.users ROW: the email
--      is set and is_anonymous flips to false. The uuid does not change.
--
-- Point 3 is the whole reason to do this. Because the id is stable, everything
-- the guest did carries over on signup with no migration of rows from one
-- owner to another — which is where guest-to-user conversion normally goes
-- wrong and silently loses carts.
--
-- auth.users is owned by Supabase; public.users is ours. These triggers keep
-- them in step.

-- ---------------------------------------------------------------------------
-- Create the application row when an auth user appears
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because the anon role has no insert privilege on
-- public.users — and must not. search_path is pinned: an unpinned search_path
-- on a SECURITY DEFINER function is a privilege-escalation hole.
--
-- Role is hard-coded to CUSTOMER. It is NEVER read from user metadata, which
-- the client controls — a self-assigned 'SUPER_ADMIN' would otherwise be one
-- signup away. Staff roles are set by a Super Admin afterwards.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, is_anonymous, role)
  values (
    new.id,
    new.email,                                        -- null when anonymous
    nullif(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.is_anonymous, false),
    'CUSTOMER'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Keep it in step — this is the guest-to-registered upgrade
-- ---------------------------------------------------------------------------
-- Fires when an anonymous user adds an email, when someone verifies a new
-- address, or when a display name changes.
--
-- role is deliberately NOT synced from metadata here, for the same reason as
-- above.

create or replace function handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users u
     set email        = new.email,
         is_anonymous = coalesce(new.is_anonymous, false),
         -- Keep the existing name if the update doesn't carry one.
         name         = coalesce(
                          nullif(new.raw_user_meta_data ->> 'name', ''),
                          u.name
                        ),
         updated_at   = now()
   where u.id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, raw_user_meta_data, is_anonymous on auth.users
  for each row execute function handle_auth_user_updated();

-- ---------------------------------------------------------------------------
-- Telling anonymous from registered inside a policy
-- ---------------------------------------------------------------------------
-- Reads the JWT claim rather than the table: it needs no row lookup, and the
-- claim is signed by the auth server, so a client cannot forge it.
--
-- Anonymous users are NOT second-class here — they browse, hold a cart, and
-- check out as guests. Use this only where an action genuinely requires a
-- durable account: leaving a review, or anything a support agent must be able
-- to trace back to a real person.

create or replace function is_anonymous_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'is_anonymous')::boolean,
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Guard: an anonymous user must never hold a staff role
-- ---------------------------------------------------------------------------
-- The trigger above hard-codes CUSTOMER, and RLS revokes the role column from
-- `authenticated`. This is the third layer — a plain data invariant that holds
-- however the row was written, including by service_role or by hand in the
-- dashboard.

alter table users add constraint users_anonymous_is_customer
  check (not is_anonymous or role = 'CUSTOMER');
