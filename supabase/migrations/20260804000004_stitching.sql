-- FUJRS — bespoke stitching. See SCHEMA.md §4.
--
-- This is the one place the schema deliberately diverges from REQUIREMENTS.md
-- §6, which nests StitchingRequest under Order. It gets its own table because:
--   * /tailoring/configure captures measurements BEFORE an order exists, and
--   * the Tailor dashboard reads the spec sheet as a unit, independently of
--     order totals.
-- Hence order_item_id is nullable.

create type stitching_status as enum (
  'AWAITING_MEASUREMENTS',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'READY_FOR_FITTING',
  'DELIVERED'
);

-- The UI shows "Awaiting Measurements"; the database stores
-- AWAITING_MEASUREMENTS. Map at the adapter boundary, per CLAUDE.md.
--
-- These stage names differ from the spec's suggested
-- Submitted/Confirmed/In Progress/Ready/Shipped — still worth confirming the
-- final wording with the client (REQUIREMENTS.md §3.2).

create table stitching_requests (
  id            uuid primary key default gen_random_uuid(),

  -- Nullable so a request can exist before checkout.
  order_item_id uuid unique references order_items(id) on delete cascade,

  user_id            uuid not null references users(id) on delete cascade,

  -- Assumes in-house tailors: a user with role TAILOR. If fulfilment moves to
  -- external workshops this becomes workshop_id against a workshops table —
  -- see SCHEMA.md §4. Don't build that until it's actually needed.
  assigned_tailor_id uuid references users(id) on delete set null,

  status        stitching_status not null default 'AWAITING_MEASUREMENTS',

  garment_type  text not null,
  neckline      text,
  sleeve        text,
  hemline       text,
  notes         text,

  -- The 12 fields from src/lib/measurements.ts, in inches.
  --
  -- jsonb rather than 12 numeric columns: the field list is still being tuned
  -- with the client, and different garment types may eventually need different
  -- fields. This absorbs that without a migration each time. Validate the
  -- shape in the adapter against MEASUREMENT_FIELDS, and add a check
  -- constraint here once the list is final.
  measurements  jsonb not null default '{}'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint measurements_is_object
    check (jsonb_typeof(measurements) = 'object')
);

create index stitching_requests_tailor_idx
  on stitching_requests (assigned_tailor_id, status);
create index stitching_requests_user_idx
  on stitching_requests (user_id);

create trigger stitching_requests_set_updated_at
  before update on stitching_requests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- stitching_reference_images
-- ---------------------------------------------------------------------------
-- REQUIREMENTS.md §3.2 asks for reference-image upload. Not built in the UI
-- yet (no storage layer), but the table exists so that work needs no migration.

-- These are photos a customer supplies — a dress they like, a fabric, possibly
-- themselves. Treated as personal data: the bucket is PRIVATE and served via
-- signed URLs, unlike product images. See the storage migration.

create table stitching_reference_images (
  id                   uuid primary key default gen_random_uuid(),
  stitching_request_id uuid not null
    references stitching_requests(id) on delete cascade,

  -- Path inside the private `stitching-references` bucket, never a URL —
  -- a public URL to one of these would defeat the point of the bucket.
  storage_path         text not null,

  width                integer check (width > 0),
  height               integer check (height > 0),
  bytes                bigint check (bytes > 0),
  mime_type            text not null,

  uploaded_at          timestamptz not null default now()
);

create index stitching_reference_images_request_idx
  on stitching_reference_images (stitching_request_id);
