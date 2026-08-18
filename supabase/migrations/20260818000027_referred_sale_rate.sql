-- FUJRS — a vendor can see WHICH rate each of their sales was paid on.
--
-- `commissions` already snapshots rate_type and rate_value at the moment of
-- the sale, precisely so a later change to a vendor's rate cannot rewrite what
-- they already earned. But vendor_referred_sales() returned only the money, so
-- the dashboard could show "PKR 1,200" without saying whether that was 10% of
-- the sale or a flat fee, and a vendor whose rate had since changed had no way
-- to tell why two similar sales paid differently.
--
-- Returning the snapshot is what makes the figure checkable: rate beside sale
-- price beside commission, and the arithmetic is visible on the row.
--
-- DROP then CREATE rather than CREATE OR REPLACE: the return table changes
-- shape, and Postgres will not replace a function's OUT parameters.

drop function if exists vendor_referred_sales();

create function vendor_referred_sales()
returns table (
  id           uuid,
  order_number text,
  item_titles  text[],
  sale_paisa   bigint,
  amount_paisa bigint,
  rate_type    commission_type,
  rate_value   numeric,
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
         -- The rate AS IT WAS, not the vendor's rate today. Reading the live
         -- rate here would relabel historic rows every time a Super Admin
         -- changed it, which is the whole reason the snapshot exists.
         c.rate_type,
         c.rate_value,
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
  'A vendor''s own commissions with the order reference, line titles, and the rate snapshot behind each one. Security definer because `orders` is not vendor-readable and must not become so; the vendor_id = auth.uid() filter in the body is what scopes it.';

revoke all on function vendor_referred_sales() from public, anon;
grant execute on function vendor_referred_sales() to authenticated;
