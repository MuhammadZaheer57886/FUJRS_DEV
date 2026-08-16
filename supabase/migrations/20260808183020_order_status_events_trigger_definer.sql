-- FUJRS — status changes must be able to write their own event log.
--
-- Mark Processing (and every other legal move) updates `orders.status`, which
-- fires `enforce_order_status_transition`. That trigger inserts into
-- `order_status_events` and, on cancel/refund, restores stock on `products`.
--
-- The function ran as the calling staff user. RLS on `order_status_events`
-- only allows SELECT — there is deliberately no client INSERT policy — so the
-- audit insert was rejected, the whole UPDATE rolled back, and the dashboard
-- showed a false "can't move to processing" toast.
--
-- SECURITY DEFINER (owner bypasses RLS) with a pinned search_path is the same
-- pattern as handle_new_auth_user / reserve_order_stock: the write is a
-- system side-effect of a staff-authorised status change, not something a
-- browser may call directly. orders_staff_update still gates who can change
-- status in the first place.

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
  'Enforces legal order status moves, restores stock on cancel/refund, and writes order_status_events. SECURITY DEFINER so the event insert is not blocked by the table''s SELECT-only RLS.';
