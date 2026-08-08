-- FUJRS — product reviews. See SCHEMA.md §8.
--
-- Sketched there but deliberately not built, because nothing rendered them.
-- The PDP now does, so this is the table it reads.
--
-- `products.rating` and `products.review_count` have always been documented as
-- denormalised counters "recomputed from reviews when that table exists, never
-- maintained by hand". This is that recomputation, as a trigger — the one
-- place it can live without eventually drifting from the rows it summarises.

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,

  -- The order that proves they bought it. Null is allowed: a review is still
  -- worth having without one, it just isn't badged as a verified purchase.
  order_id   uuid references orders(id) on delete set null,

  rating     integer not null check (rating between 1 and 5),
  title      text,
  body       text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One review per person per product. Editing yours updates this row; it is
  -- not a comment thread.
  unique (product_id, user_id)
);

create index reviews_product_idx on reviews (product_id, created_at desc);

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Keeping products.rating in step
-- ---------------------------------------------------------------------------
-- Recomputed from the rows, never incremented: an incremental counter drifts
-- the first time a delete is missed, and then the number on every product card
-- is quietly wrong with nothing to compare it against.
--
-- A product with no reviews gets NULL, not 0 — the column's comment says a
-- zero would read as "rated badly" rather than "not rated".

create or replace function refresh_product_rating()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.product_id, old.product_id);
begin
  update products p
     set rating = sub.avg_rating,
         review_count = sub.total
    from (
      select round(avg(rating)::numeric, 1) as avg_rating,
             count(*)                       as total
        from reviews
       where product_id = target
    ) sub
   where p.id = target;

  -- avg() over no rows is null, which is exactly what we want, but count() is
  -- 0 and review_count is NOT NULL — so the update above already handles both.
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function refresh_product_rating();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Tables created after the rls migration start with security DISABLED.

alter table reviews enable row level security;

-- Reviews are public: that is the entire point of them.
create policy reviews_public_read on reviews
  for select using (true);

-- Writing needs a DURABLE account. `is_anonymous_user()` is the check
-- BACKEND_SETUP.md §7 reserves for exactly this case: a guest can browse, hold
-- a bag and check out, but a review that nobody can be held to is a review
-- anyone can write in a loop.
create policy reviews_own_write on reviews
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not is_anonymous_user());

-- Staff can remove a review. Moderation is a real need — abuse, a customer's
-- phone number pasted into the body — and there is no other route to it.
create policy reviews_staff_delete on reviews
  for delete using (is_staff());

comment on table reviews is
  'One review per user per product. products.rating and review_count are recomputed from here by trigger — never written by hand.';
