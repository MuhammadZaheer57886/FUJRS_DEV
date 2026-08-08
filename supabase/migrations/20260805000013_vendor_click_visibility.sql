-- FUJRS — a vendor can count their own clicks.
--
-- `referral_clicks` was Super-Admin-read-only, with the reasoning that "one
-- that could read here could see another vendor's traffic". That holds for an
-- unscoped policy; it does not hold for one filtered to the caller. Without
-- this, the vendor dashboard reports zero clicks forever, which is worse than
-- the risk it was avoiding — a number that is always wrong teaches people to
-- ignore the screen.
--
-- Writes remain server-only. A vendor who could insert here could fabricate
-- the traffic they are paid for, and that is the policy that actually matters.

create policy referral_clicks_own_read on referral_clicks
  for select using (vendor_id = auth.uid());

comment on table referral_clicks is
  'Server-insert only. A vendor may read their own rows; nobody may write them from a client.';
