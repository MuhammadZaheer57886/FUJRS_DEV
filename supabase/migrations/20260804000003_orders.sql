-- FUJRS — orders. See SCHEMA.md §3.
--
-- Two principles run through this file:
--   1. Snapshot, don't reference. Line items copy title and price; orders copy
--      the shipping address. If they pointed at live rows, a price change or an
--      address edit would silently rewrite historical invoices.
--   2. Status transitions are enforced in the database, not just the UI.

create type order_status as enum
  ('CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED');

create table orders (
  id           uuid primary key default gen_random_uuid(),

  -- The short human-facing code the UI already shows (#2VVS7D5B). Give
  -- customers this, never the UUID.
  order_number text not null unique,

  user_id      uuid references users(id) on delete set null,  -- null = guest
  status       order_status not null default 'CONFIRMED',

  fabric_total_paisa    bigint not null check (fabric_total_paisa >= 0),
  stitching_total_paisa bigint not null default 0 check (stitching_total_paisa >= 0),
  shipping_paisa        bigint not null default 0 check (shipping_paisa >= 0),
  total_paisa           bigint not null check (total_paisa >= 0),

  -- Copied, not foreign-keyed. See principle 1 above.
  ship_first_name text not null,
  ship_last_name  text not null,
  ship_street     text not null,
  ship_city       text not null,
  ship_postal     text not null,
  contact_email   text not null,

  -- The vendor referral this order is credited to, or null when direct.
  -- The server must re-derive this from referral_clicks rather than trusting
  -- a value the browser supplies.
  referral_code   text,

  placed_at    timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index orders_user_idx on orders (user_id, placed_at desc);
create index orders_status_idx on orders (status);
create index orders_referral_idx on orders (referral_code)
  where referral_code is not null;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,

  -- Nullable: the product may be archived long after the order ships.
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,

  -- Snapshot at purchase time. A later price rise must never change what a
  -- customer was charged.
  title            text not null,
  image_url        text,
  unit_price_paisa bigint not null check (unit_price_paisa >= 0),
  quantity         integer not null check (quantity > 0),

  stitching_label       text,
  stitching_addon_paisa bigint check (stitching_addon_paisa >= 0)
);

create index order_items_order_idx on order_items (order_id);

-- ---------------------------------------------------------------------------
-- order_status_events
-- ---------------------------------------------------------------------------
-- Audit trail. Refunds move money, so who changed what and when is worth
-- keeping.

create table order_status_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index order_status_events_order_idx
  on order_status_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Transition rules
-- ---------------------------------------------------------------------------
-- Mirrors src/lib/orderStatus.ts. The UI already refuses illegal moves; this
-- is the boundary that actually enforces it, because a client can send any
-- payload it likes.
--
--   CONFIRMED  -> PROCESSING, CANCELLED
--   PROCESSING -> DELIVERED, CANCELLED
--   DELIVERED  -> REFUNDED
--   CANCELLED  -> REFUNDED
--   REFUNDED   -> (terminal)

create or replace function enforce_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'CONFIRMED'  and new.status in ('PROCESSING', 'CANCELLED')) or
    (old.status = 'PROCESSING' and new.status in ('DELIVERED', 'CANCELLED'))  or
    (old.status = 'DELIVERED'  and new.status = 'REFUNDED')                   or
    (old.status = 'CANCELLED'  and new.status = 'REFUNDED')
  ) then
    raise exception 'illegal order status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  insert into order_status_events (order_id, from_status, to_status)
  values (new.id, old.status, new.status);

  return new;
end;
$$;

create trigger orders_enforce_status_transition
  before update of status on orders
  for each row execute function enforce_order_status_transition();
