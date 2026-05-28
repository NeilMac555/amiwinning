-- ---------------------------------------------------------------------------
-- Am I Up — profile avatars.
--
-- Each profile may have a single uploaded JPEG/PNG stored in the `avatars`
-- bucket. The path convention is `<user_id>/avatar.jpg`. The public URL is
-- mirrored into profiles.avatar_url so we can serve the public profile page
-- with one query.
--
-- If avatar_url is null, the UI falls back to a deterministic SVG pattern
-- generated from the handle (see src/components/GeneratedAvatar.tsx).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- Storage bucket: public read, owner-only writes.
--
-- We create the bucket with `public = true` so the rendered URL needs no
-- token. Authentication still controls who can upload (the RLS policies
-- below). Max-file size is enforced client-side (~2MB after resize), with
-- the bucket allowing up to 5MB as a hard ceiling.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage RLS — only allow a signed-in user to write to a folder whose name
-- matches their auth.uid(). The first path segment IS the user_id, so
-- (storage.foldername(name))[1] = auth.uid()::text guards access.
--
-- Anyone (including anon) can read — bucket is public.
-- ---------------------------------------------------------------------------

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
