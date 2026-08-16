-- FUJRS — a vendor can read back the sale behind their own commission.
--
-- The vendor dashboard's "Recent Referred Sales" table asked for the order and
-- its line titles by embedding them off `commissions`:
--
--   .select('id, sale_paisa, ..., orders ( order_number, order_items ( title ) )')
--
-- That embed is filtered by RLS, and a vendor satisfies neither policy on
-- `orders`: `orders_own_read` wants `user_id = auth.uid()` (the order belongs
-- to the CUSTOMER) and `orders_staff_read` wants `is_staff()`, which is ADMIN
-- and SUPER_ADMIN only. So the join came back null on every row and the table
-- rendered "-" for the product and "#" for the order number, next to a real
-- money figure. The commission was right; the sale it belonged to was blank.
--
-- The fix is NOT a read policy on `orders`. That table carries the customer's
-- name, street, city, postcode and email, and a vendor has no business with
-- any of it — RLS is row-level, so "let them see the order but not the
-- address" cannot be written as a policy.
--
-- So: a security definer function that returns exactly the three facts a
-- vendor is entitled to (the order's public reference, what the pieces were
-- called, and their own commission row) and nothing else. `vendor_id =
-- auth.uid()` inside the body is the security boundary, since the definer
-- rights mean RLS is not doing the filtering here.

create or replace function vendor_referred_sales()
returns table (
  id           uuid,
  order_number text,
  item_titles  text[],
  sale_paisa   bigint,
  amount_paisa bigint,
  status       commission_status,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,
         o.order_number,
         -- Titles only. Not prices, not quantities: the commission carries the
         -- sale value it was calculated from, and the line-by-line breakdown of
         -- someone else's purchase is not the vendor's to see.
         coalesce(
           (select array_agg(i.title order by i.title)
              from order_items i
             where i.order_id = o.id),
           '{}'::text[]
         ),
         c.sale_paisa,
         c.amount_paisa,
         -- Returned so the dashboard can say WHY a sale has not paid yet.
         -- Without it a PENDING commission reads as money that went missing.
         c.status,
         c.created_at
    from commissions c
    join orders o on o.id = c.order_id
   where c.vendor_id = auth.uid()
   order by c.created_at desc;
$$;

comment on function vendor_referred_sales() is
  'A vendor''s own commissions with the order reference and line titles behind each one. Security definer because `orders` is not vendor-readable and must not become so; the vendor_id = auth.uid() filter in the body is what scopes it.';

-- anon has no commissions, and a signed-out caller reaching a definer function
-- is never wanted.
revoke all on function vendor_referred_sales() from public, anon;
grant execute on function vendor_referred_sales() to authenticated;
