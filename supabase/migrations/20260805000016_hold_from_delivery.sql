-- FUJRS — the commission hold runs from DELIVERY, not from placement.
--
-- The returns policy on /returns-exchanges says: "Items must be returned within
-- 14 days of delivery." The first version of credit_due_commissions() counted
-- 14 days from `placed_at`, which is a different date and always an earlier
-- one. An order placed on the 1st and delivered on the 10th could be returned
-- until the 24th, but its commission credited on the 15th — nine days inside
-- the window where the goods can still come back.
--
-- That is the exact failure the hold exists to prevent, so the clock now starts
-- when the customer actually received the piece.
--
-- Delivery time comes from `order_status_events`, which the transition trigger
-- already writes. No new column: the audit trail is the record of when things
-- happened, and a second copy of it would be a second thing to keep in step.

create or replace function credit_due_commissions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  credited integer;
begin
  with due as (
    update commissions c
       set status = 'CREDITED',
           credited_at = now()
      from orders o
     where o.id = c.order_id
       and c.status = 'PENDING'
       -- Delivered, and delivered long enough ago. An order still in transit
       -- has not completed, so there is nothing to credit yet — and one that
       -- never arrives never credits, which is the right answer.
       and o.status = 'DELIVERED'
       and exists (
         select 1
           from order_status_events e
          where e.order_id = o.id
            and e.to_status = 'DELIVERED'
            and e.created_at < now() - interval '14 days'
       )
    returning c.id
  )
  select count(*) into credited from due;

  return credited;
end;
$$;

comment on function credit_due_commissions() is
  'Moves PENDING commission to CREDITED once the 14-day returns window has closed, counted from DELIVERY (order_status_events). Idempotent. Cancelled and refunded orders never qualify — they are not DELIVERED.';

revoke all on function credit_due_commissions() from public, anon, authenticated;
