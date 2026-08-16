-- FUJRS — refund requests. See SCHEMA.md §3.1.
--
-- Before this migration a refund was something staff did TO an order: the
-- admin dashboard offered a Refund button on any delivered order and the
-- transition trigger accepted it. That records money moving with no reason, no
-- requester and no date requested, which is exactly what the order audit trail
-- exists to answer.
--
-- A refund now starts with the customer:
--
--   customer raises a request against a DELIVERED order, inside the return
--   window (src/lib/refunds.ts)
--        -> staff APPROVE   -> the order moves to REFUNDED, which releases
--                              stock and reverses commission through the
--                              triggers that already exist
--        -> staff DECLINE   -> the order stays DELIVERED
--
-- DELIVERED -> REFUNDED is therefore no longer reachable without an approved
-- request. CANCELLED -> REFUNDED is left alone: cancelling a prepaid order
-- means returning money nobody had to ask for.

-- ---------------------------------------------------------------------------
-- orders.delivered_at
-- ---------------------------------------------------------------------------
-- The return window is counted from DELIVERY, not from the order date, so the
-- date has to be on the row the window is checked against. order_status_events
-- already records the move, but a policy that had to join it on every insert
-- would be both slower and harder to read.

alter table orders add column delivered_at timestamptz;

-- Backfill from the audit trail for orders delivered before this column
-- existed. Orders delivered before order_status_events was in place stay null,
-- which the app reads as "no clock to check" rather than "window closed".
update orders o
   set delivered_at = e.created_at
  from (
    select distinct on (order_id) order_id, created_at
      from order_status_events
     where to_status = 'DELIVERED'
     order by order_id, created_at asc
  ) e
 where e.order_id = o.id
   and o.delivered_at is null;

-- ---------------------------------------------------------------------------
-- refund_requests
-- ---------------------------------------------------------------------------

create type refund_request_status as enum ('REQUESTED', 'APPROVED', 'DECLINED');

create table refund_requests (
  id       uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,

  -- Who asked. Stored rather than read through orders.user_id so the own-rows
  -- policy below is a column comparison instead of a join on every select.
  user_id  uuid not null references users(id) on delete cascade,

  status   refund_request_status not null default 'REQUESTED',

  -- The customer's own words. Rendered as text, never as HTML (CLAUDE.md).
  -- The bounds are MIN_/MAX_REFUND_REASON_LENGTH from src/lib/refunds.ts; the
  -- form checks them for the customer's benefit, this is the boundary.
  reason   text not null check (char_length(btrim(reason)) between 10 and 500),

  -- Snapshot of what was asked back, for the same reason order_items snapshot
  -- their price: the total must not drift after the request is raised.
  amount_paisa bigint not null check (amount_paisa >= 0),

  staff_note  text check (staff_note is null or char_length(staff_note) <= 500),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A ruling has a ruler and a time; an open request has neither.
  constraint refund_requests_review_complete check (
    (status = 'REQUESTED' and reviewed_at is null) or
    (status <> 'REQUESTED' and reviewed_at is not null)
  )
);

-- One open request per order. Without this, two tabs could raise two requests
-- and staff could approve both, attempting the refund twice.
create unique index refund_requests_open_idx on refund_requests (order_id)
  where status = 'REQUESTED';

create index refund_requests_order_idx on refund_requests (order_id, created_at desc);
create index refund_requests_user_idx on refund_requests (user_id, created_at desc);
create index refund_requests_queue_idx on refund_requests (status, created_at);

create trigger refund_requests_set_updated_at
  before update on refund_requests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Stamping the review
-- ---------------------------------------------------------------------------
-- reviewed_by and reviewed_at are set here rather than sent by the client. A
-- client-supplied reviewer is a claim, not a fact, and this is an audit field.

create or replace function stamp_refund_review()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if old.status <> 'REQUESTED' then
      raise exception 'refund request % has already been reviewed', old.id
        using errcode = 'check_violation';
    end if;

    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  -- The request itself is a historical record once raised.
  new.order_id     := old.order_id;
  new.user_id      := old.user_id;
  new.reason       := old.reason;
  new.amount_paisa := old.amount_paisa;
  new.created_at   := old.created_at;

  return new;
end;
$$;

create trigger refund_requests_stamp_review
  before update on refund_requests
  for each row execute function stamp_refund_review();

-- ---------------------------------------------------------------------------
-- Approving is what refunds the order
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because the customer never has, and must never be given,
-- update rights on `orders`. The staff member updates the request; the
-- database performs the order move, so the two cannot drift apart the way two
-- separate client writes would if the second one failed.

create or replace function refund_order_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then
    update orders set status = 'REFUNDED' where id = new.order_id;
  end if;

  return null;
end;
$$;

create trigger refund_requests_refund_order
  after update of status on refund_requests
  for each row execute function refund_order_on_approval();

-- ---------------------------------------------------------------------------
-- DELIVERED -> REFUNDED now needs an approved request behind it
-- ---------------------------------------------------------------------------
-- Replaces the function last defined in
-- 20260808183020_order_status_events_trigger_definer.sql. Everything it did
-- stands (SECURITY DEFINER so the audit insert clears the SELECT-only RLS on
-- order_status_events, and the stock restore on the way into a stopped state);
-- this adds the approved-request condition and the delivery stamp.
--
-- The refund_requests trigger above runs before this one sees the order
-- update, so the APPROVED row is already committed to the transaction when the
-- exists() check reads it.

create or replace function enforce_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
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

  -- A delivered order is complete. The only thing that reopens it is the
  -- customer asking, and staff agreeing.
  if old.status = 'DELIVERED' and new.status = 'REFUNDED'
     and not exists (
       select 1 from refund_requests r
        where r.order_id = new.id
          and r.status = 'APPROVED'
     ) then
    raise exception 'a delivered order can only be refunded through an approved refund request'
      using errcode = 'check_violation';
  end if;

  -- The return window is counted from here (src/lib/refunds.ts), so it is
  -- stamped on the way in and never moved by a later status change.
  if new.status = 'DELIVERED' and new.delivered_at is null then
    new.delivered_at := now();
  end if;

  -- Only on the way IN to a stopped state. CANCELLED -> REFUNDED is a legal
  -- move, and the stock went back at CANCELLED; returning it again would
  -- invent inventory.
  if new.status in ('CANCELLED', 'REFUNDED')
     and old.status not in ('CANCELLED', 'REFUNDED') then
    update products p
       set stock = p.stock + oi.qty
      from (select product_id, sum(quantity)::int as qty
              from order_items
             where order_id = new.id
               and product_id is not null
             group by product_id) oi
     where p.id = oi.product_id;
  end if;

  insert into order_status_events (order_id, from_status, to_status)
  values (new.id, old.status, new.status);

  return new;
end;
$$;

comment on function enforce_order_status_transition() is
  'Enforces legal order status moves, requires an approved refund_request before DELIVERED -> REFUNDED, stamps delivered_at, restores stock on cancel/refund, and writes order_status_events. SECURITY DEFINER so the event insert is not blocked by the table''s SELECT-only RLS.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table refund_requests enable row level security;

create policy refund_requests_own_read on refund_requests
  for select using (user_id = auth.uid());

create policy refund_requests_staff_read on refund_requests
  for select using (is_staff());

-- The eligibility rules from src/lib/refunds.ts, enforced where it counts. The
-- client check is UX; this is the boundary (CLAUDE.md).
create policy refund_requests_own_insert on refund_requests
  for insert with check (
    user_id = auth.uid()
    and status = 'REQUESTED'
    and exists (
      select 1 from orders o
       where o.id = refund_requests.order_id
         and o.user_id = auth.uid()
         and o.status = 'DELIVERED'
         -- RETURN_WINDOW_DAYS in src/lib/refunds.ts. Changing one means
         -- changing both, along with the copy on /returns-exchanges.
         and (o.delivered_at is null or o.delivered_at > now() - interval '14 days')
    )
    -- One request per order, matching refundEligibility(): a declined refund
    -- is not re-raised by trying again, it is taken up with a human. The
    -- partial unique index above still stands for two concurrent inserts,
    -- which pass this check simultaneously.
    and not exists (
      select 1 from refund_requests prior
       where prior.order_id = refund_requests.order_id
    )
  );

-- Only staff rule on a request, and a customer may never withdraw the record
-- of one: there is no delete policy at all.
create policy refund_requests_staff_review on refund_requests
  for update using (is_staff()) with check (is_staff());

comment on table refund_requests is
  'Customer-initiated refunds. Approving one is the only way a DELIVERED order reaches REFUNDED; see src/lib/refunds.ts for the matching client-side rules.';
