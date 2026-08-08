-- FUJRS — Supabase Storage buckets and access policies.
--
-- Three buckets, and the difference between them matters:
--
--   product-images       PUBLIC   catalogue photography — meant to be seen
--   avatars              PUBLIC   small profile pictures
--   stitching-references PRIVATE  customer-supplied photos — personal data
--
-- A "public" bucket means anyone with the URL can fetch the object, forever,
-- without a session. That is correct for catalogue photos and wrong for
-- anything a customer uploaded about themselves.

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
-- file_size_limit and allowed_mime_types are enforced by Storage itself, so a
-- client that skips the upload UI still can't push a 40MB TIFF or an .exe.
-- Client-side validation is UX; this is the boundary.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images', 'product-images', true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'avatars', 'avatars', true,
    2097152,  -- 2 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'stitching-references', 'stitching-references', false,
    10485760, -- 10 MB — phone photos, several per request
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- product-images — world-readable, staff-writable
-- ---------------------------------------------------------------------------
-- Path convention: <product_id>/<position>-<slug>.<ext>
-- Keeping the product id as the first folder makes deleting a product's whole
-- image set a prefix delete rather than a lookup.

create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "staff upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_staff());

create policy "staff update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_staff())
  with check (bucket_id = 'product-images' and is_staff());

create policy "staff delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_staff());

-- ---------------------------------------------------------------------------
-- avatars — world-readable, owner-writable
-- ---------------------------------------------------------------------------
-- Path convention: <user_id>/avatar.<ext>
--
-- The folder check is what stops one user overwriting another's avatar:
-- storage.foldername(name) splits the object path, and [1] is the first
-- segment. Without it, any authenticated user could write to any path in the
-- bucket.

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users manage their own avatar"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- stitching-references — PRIVATE
-- ---------------------------------------------------------------------------
-- Path convention: <user_id>/<stitching_request_id>/<uuid>.<ext>
--
-- No public read policy at all. Serve these with createSignedUrl() and a short
-- expiry, so a link that leaks stops working. Readable by three parties only:
-- the customer who uploaded it, the tailor assigned to that request, and staff.

create policy "customers manage their own reference images"
  on storage.objects for all
  using (
    bucket_id = 'stitching-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'stitching-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The assigned tailor needs to see what the customer is asking for. Scoped to
-- the specific request, so a tailor cannot browse the whole bucket: the second
-- path segment must be a request assigned to them.
create policy "assigned tailor reads reference images"
  on storage.objects for select
  using (
    bucket_id = 'stitching-references'
    and exists (
      select 1
        from stitching_requests r
       where r.assigned_tailor_id = auth.uid()
         and r.id::text = (storage.foldername(name))[2]
    )
  );

create policy "staff read reference images"
  on storage.objects for select
  using (bucket_id = 'stitching-references' and is_staff());

-- ---------------------------------------------------------------------------
-- Sizing rules the upload UI must enforce
-- ---------------------------------------------------------------------------
-- Storage checks bytes and mime type. It cannot check pixel dimensions, so the
-- client reads them before upload and writes them to product_images.width /
-- .height — next/image needs both to reserve space and avoid layout shift.
--
--   Product   4:5 portrait.  Recommended 1600x2000, minimum 1200x1500.
--             Matches aspect-[4/5], which 24 of the app's image slots use.
--             Largest render is ~66vw, so 1600px wide covers a 2x display.
--   Avatar    1:1 square.    Recommended 512x512, minimum 256x256.
--   Banner    16:9.          Recommended 2400x1350.
--
-- Reject with a reason ("this image is 800x600 — product photos need to be
-- portrait, at least 1200x1500"), never silently accept and stretch it.
--
-- Convert to WebP on upload where you can: roughly 30% smaller than JPEG at
-- the same quality, and every browser FUJRS targets supports it.
