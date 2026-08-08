-- FUJRS — making the stitching queue reachable.
--
-- `stitching_assigned_tailor` lets a tailor read only what is assigned to
-- them, which is right. But nothing assigns anyone: a bespoke order stamps
-- order_item_id and leaves assigned_tailor_id null, so every tailor's queue
-- was empty and the work was visible to nobody.
--
-- Rather than invent an assignment step nobody asked for, unassigned work is a
-- POOL. A tailor sees jobs waiting to be picked up as well as their own, and
-- claiming one is a normal update. That is how a small atelier actually works,
-- and it needs no new screen.

-- ---------------------------------------------------------------------------
-- Tailors: see the pool, claim from it, progress your own
-- ---------------------------------------------------------------------------

create policy stitching_unassigned_pool on stitching_requests
  for select using (
    assigned_tailor_id is null
    and order_item_id is not null   -- ordered work only, never someone's draft
    and current_app_role() = 'TAILOR'
  );

-- A tailor may update a job that is theirs, or claim one that is nobody's.
-- The WITH CHECK stops the obvious abuse: claiming a job FOR someone else, or
-- taking one already assigned.
create policy stitching_tailor_claim on stitching_requests
  for update
  using (
    current_app_role() = 'TAILOR'
    and order_item_id is not null
    and (assigned_tailor_id is null or assigned_tailor_id = auth.uid())
  )
  with check (
    current_app_role() = 'TAILOR'
    and assigned_tailor_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Staff: see everything, so someone can answer "where is my order?"
-- ---------------------------------------------------------------------------
-- Read-only. An Admin overseeing the atelier needs to see the queue; moving a
-- garment's status is the tailor's call, and letting an Admin do it silently
-- would make the audit trail meaningless.

create policy stitching_staff_read on stitching_requests
  for select using (is_staff());

comment on column stitching_requests.assigned_tailor_id is
  'Null means unclaimed: the job sits in the pool any TAILOR can pick up.';
