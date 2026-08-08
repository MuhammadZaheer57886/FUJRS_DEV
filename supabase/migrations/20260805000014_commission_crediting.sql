-- FUJRS — commission actually becoming payable.
--
-- Commission is written PENDING when a referred order is placed, and only
-- CREDITED commission counts toward a vendor's balance. Nothing moved rows
-- between the two, so every vendor balance read zero: the plumbing existed and
-- the policy did not.
--
-- The policy is a HOLD PERIOD. A refund reverses commission (the clawback
-- trigger in the affiliate migration), so paying out before the return window
-- closes means paying for goods that can still come back.
--
-- 14 days is a placeholder, matching COMMISSION_HOLD_DAYS in
-- src/lib/commission.ts. The real number is the returns window in the
-- programme terms (REQUIREMENTS.md §8). Both places must change together.

-- ---------------------------------------------------------------------------
-- credit_due_commissions
-- ---------------------------------------------------------------------------

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
       -- The clock runs from the order, not from now-minus-something on the
       -- commission row, so a backdated import behaves the same as a live sale.
       and o.placed_at < now() - interval '14 days'
       -- A cancelled or refunded order never earns. The clawback trigger
       -- already reverses what it can; this stops anything slipping past it in
       -- the window between the refund and the next run.
       and o.status not in ('CANCELLED', 'REFUNDED')
    returning c.id
  )
  select count(*) into credited from due;

  return credited;
end;
$$;

comment on function credit_due_commissions() is
  'Moves PENDING commission to CREDITED once the return window has closed. Idempotent — re-running credits nothing twice. Scheduled daily; see the cron block below.';

-- Vendors must never be able to credit their own commission.
revoke all on function credit_due_commissions() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Run it daily
-- ---------------------------------------------------------------------------
-- Guarded: pg_cron has to be enabled for the project, and a migration that
-- hard-failed on a missing extension would block every later one. If the
-- schedule is skipped the function still exists and can be called by hand or
-- from a scheduled job elsewhere — the notice says so.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- unschedule-then-schedule so re-running this migration doesn't stack jobs
    perform cron.unschedule('credit-due-commissions')
      where exists (select 1 from cron.job where jobname = 'credit-due-commissions');

    perform cron.schedule(
      'credit-due-commissions',
      '17 2 * * *',   -- 02:17 daily, off the hour so it isn't racing everything else
      $cron$select credit_due_commissions();$cron$
    );
  else
    raise notice 'pg_cron unavailable — credit_due_commissions() exists but is not scheduled. Call it daily from elsewhere.';
  end if;
end;
$$;
