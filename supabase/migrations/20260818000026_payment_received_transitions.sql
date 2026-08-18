-- FUJRS — route the order flow through PAYMENT_RECEIVED.
--
-- Separate from the migration that adds the enum value because Postgres
-- refuses to use a value added in the same transaction.
--
-- Mirrors src/lib/orderStatus.ts:
--
--   CONFIRMED        -> PROCESSING, CANCELLED
--   PROCESSING       -> PAYMENT_RECEIVED, CANCELLED
--   PAYMENT_RECEIVED -> DELIVERED, CANCELLED
--   DELIVERED        -> REFUNDED
--   CANCELLED        -> REFUNDED
--   REFUNDED         -> (terminal)
--
-- PROCESSING -> DELIVERED is deliberately gone. Leaving it in would keep the
-- old path open beside the new one, and the point of the step is that no order
-- reaches delivered without the collection being recorded.
--
-- Cancelling stays available at PAYMENT_RECEIVED: nothing has been handed over
-- yet, and cash collected on an order that is then cancelled has to be
-- refundable, which the existing CANCELLED -> REFUNDED move already covers.
--
-- The commission hold is untouched. It counts from the DELIVERED event in
-- order_status_events (see 20260805000016_hold_from_delivery), and delivery is
-- still delivery — the new step sits before it, so no clock moves.

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
    (old.status = 'CONFIRMED'        and new.status in ('PROCESSING', 'CANCELLED'))       or
    (old.status = 'PROCESSING'       and new.status in ('PAYMENT_RECEIVED', 'CANCELLED')) or
    (old.status = 'PAYMENT_RECEIVED' and new.status in ('DELIVERED', 'CANCELLED'))        or
    (old.status = 'DELIVERED'        and new.status = 'REFUNDED')                         or
    (old.status = 'CANCELLED'        and new.status = 'REFUNDED')
  ) then
    raise exception 'illegal order status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
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
  'Enforces legal order status moves (CONFIRMED -> PROCESSING -> PAYMENT_RECEIVED -> DELIVERED), restores stock on cancel/refund, and writes order_status_events. SECURITY DEFINER so the event insert is not blocked by the table''s SELECT-only RLS.';
