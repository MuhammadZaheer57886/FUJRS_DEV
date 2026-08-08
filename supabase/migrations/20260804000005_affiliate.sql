-- FUJRS — affiliate system. See SCHEMA.md §5.

-- Vendors only. The browser build derives this from a hash of the vendor's
-- email so it survives a reload without storage; the real one is ISSUED and
-- stored, because a derived code means a vendor can never change their email
-- without losing their code, and it leaks a fact about that email.
alter table users add column referral_code text unique;

create index users_referral_code_idx on users (referral_code)
  where referral_code is not null;

-- ---------------------------------------------------------------------------
-- affiliate_links
-- ---------------------------------------------------------------------------

create table affiliate_links (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Matches addLink(), which refreshes rather than duplicating.
  unique (vendor_id, product_id)
);

create index affiliate_links_vendor_idx on affiliate_links (vendor_id);

-- ---------------------------------------------------------------------------
-- referral_clicks
-- ---------------------------------------------------------------------------
-- The table the browser build cannot have, and the reason the vendor dashboard
-- says clicks "need a backend before they're real". Attribution is a
-- server-side fact about traffic the server saw — a client can claim anything.

create table referral_clicks (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references users(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,

  -- Anonymous cookie identifier, not a user id — most clicks are logged out.
  visitor_token text not null,

  -- Hashed, never the raw address. Raw IPs are personal data under most
  -- privacy regimes and there's no use for them beyond deduplication.
  ip_hash       text,

  user_agent    text,
  clicked_at    timestamptz not null default now()
);

create index referral_clicks_visitor_idx
  on referral_clicks (visitor_token, clicked_at desc);
create index referral_clicks_vendor_idx
  on referral_clicks (vendor_id, clicked_at desc);

-- ---------------------------------------------------------------------------
-- Commission
-- ---------------------------------------------------------------------------

create type commission_type   as enum ('PERCENT', 'FLAT');
create type commission_status as enum ('PENDING', 'CREDITED', 'PAID', 'REVERSED');

-- Set per vendor by a Super Admin. Supports both models, so the
-- flat-vs-percentage question in REQUIREMENTS.md §8 needs no answer here.
alter table users
  add column commission_type  commission_type default 'PERCENT',
  add column commission_value numeric(10,2) default 10
    check (commission_value is null or commission_value >= 0);

create table commissions (
  id        uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references users(id) on delete cascade,
  order_id  uuid not null references orders(id) on delete cascade,
  status    commission_status not null default 'PENDING',

  -- The rate is COPIED, not looked up. Changing a vendor's rate must not
  -- retroactively rewrite commission they already earned — same snapshot
  -- principle as order line items, and it matters more here because it is
  -- the vendor's money.
  rate_type    commission_type not null,
  rate_value   numeric(10,2) not null check (rate_value >= 0),
  sale_paisa   bigint not null check (sale_paisa >= 0),
  amount_paisa bigint not null check (amount_paisa >= 0),

  credited_at  timestamptz,
  created_at   timestamptz not null default now(),

  unique (vendor_id, order_id)
);

create index commissions_vendor_status_idx on commissions (vendor_id, status);
create index commissions_order_idx on commissions (order_id);

-- ---------------------------------------------------------------------------
-- Refund clawback
-- ---------------------------------------------------------------------------
-- The vendor dashboard promises "a sale counts once the order is confirmed and
-- the return window has closed."
--
-- This is the easiest place in the whole system to lose real money: without
-- it, a refunded order still pays out commission on goods that came back.

create or replace function reverse_commission_on_refund()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'REFUNDED' and old.status is distinct from 'REFUNDED' then
    update commissions
       set status = 'REVERSED'
     where order_id = new.id
       and status in ('PENDING', 'CREDITED');
  end if;
  return new;
end;
$$;

create trigger orders_reverse_commission
  after update of status on orders
  for each row execute function reverse_commission_on_refund();

-- Note: commission already PAID is deliberately not reversed here — that money
-- has left the building and needs a human decision (deduct from the next
-- payout, or absorb it). Surface it to the Super Admin instead of silently
-- rewriting a paid record.
