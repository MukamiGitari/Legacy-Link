-- Migration: real photo storage instead of base64 data URLs in the `photos` table.
--
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Photos are uploaded to the `family-photos` bucket under paths shaped
-- `<family_id>/<album_id>/<uuid>.<ext>`, matching src/lib/db.ts's uploadPhotoFile().
-- The bucket is public for reads (so <img src="..."> works directly without
-- signed URLs), but writes are scoped to members of that family, and — same
-- rule as every other content table — the Guest role cannot write.

insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "family_photos_public_read" on storage.objects;
drop policy if exists "family_photos_family_insert" on storage.objects;
drop policy if exists "family_photos_family_delete" on storage.objects;

-- Anyone can read (the bucket is public and photo URLs are shared inside the app).
create policy "family_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'family-photos');

-- Only non-guest members of the family named in the path's first folder may upload.
create policy "family_photos_family_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'family-photos'
    and current_role_can_add()
    and (storage.foldername(name))[1] = current_family_id()::text
  );

-- Only admins of that family may delete an uploaded photo file.
create policy "family_photos_family_delete"
  on storage.objects for delete
  using (
    bucket_id = 'family-photos'
    and current_role_is_admin()
    and (storage.foldername(name))[1] = current_family_id()::text
  );
