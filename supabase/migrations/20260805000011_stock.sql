-- FUJRS — inventory movement.
--
-- Stock was checked when an order was placed but never reduced, so the same
-- last item could be sold indefinitely. Reading stock and then writing it from
-- application code cannot fix that: between the read and the write, another
-- request fits.
--
--   A: reads stock = 1, ok
--   B: reads stock = 1, ok      <- before A has written
--   A: writes stock = 0
--   B: writes stock = 0         <- two sold, one existed
--
-- The `and stock >= qty` below is what closes it. Postgres locks the row for
-- the duration of the UPDATE, so the second caller evaluates the condition
-- against the first caller's result and matches zero rows.

-- ---------------------------------------------------------------------------
-- reserve_order_stock
-- ---------------------------------------------------------------------------
-- Takes the whole order at once. A function body is a single transaction, so
-- raising on line three undoes lines one and two — an order never half-reserves.
--
-- Called by POST /api/orders with the service role, after the order rows are
-- written. It is NOT granted to anon or authenticated: stock is not something
-- a browser may move.

create or replace function reserve_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  for line in
    select oi.product_id, sum(oi.quantity)::int as qty
      from order_items oi
     where oi.order_id = p_order_id
       and oi.product_id is not null
     group by oi.product_id
     -- Deterministic order. Two concurrent orders holding the same two
     -- products in opposite orders would otherwise deadlock waiting on each
     -- other's row locks.
     order by oi.product_id
  loop
    update products
       set stock = stock - line.qty
     where id = line.product_id
       and stock >= line.qty;

    if not found then
      raise exception 'insufficient stock for product %', line.product_id
        using errcode = 'check_violation';
    end if;
  end loop;
end;
$$;

comment on function reserve_order_stock(uuid) is
  'Atomically decrements stock for every line of an order. Raises check_violation if any line cannot be met, rolling back the whole reservation.';

revoke all on function reserve_order_stock(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Returning stock when an order stops
-- ---------------------------------------------------------------------------
-- A cancelled or refunded order releases what it held. Without this, cancelling
-- would quietly destroy inventory — the goods are back on the shelf but the
-- number says they are not.
--
-- Folded into the existing transition trigger rather than a second trigger, so
-- the release happens in the same statement that changes the status and cannot
-- be skipped by writing the status some other way.

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
