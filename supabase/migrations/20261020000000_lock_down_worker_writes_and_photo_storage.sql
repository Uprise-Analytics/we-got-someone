begin;

-- Hole 2: workers can only edit safe profile fields on their own row.
-- Creating profiles, activation, free periods, counters and referral data are server-only (service role).
revoke insert, update, delete, truncate, trigger, references on public.workers from anon, authenticated;
grant update (
  name, bio, skills, city, area, phone, photo_url, banner_url, email, website,
  available_now, gender, date_of_birth, languages, own_transport, years_experience,
  service_areas, work_photos
) on public.workers to authenticated;
grant delete on public.workers to authenticated;

drop policy if exists "Workers can insert own profile" on public.workers;
drop policy if exists "Workers can update own profile" on public.workers;
create policy "Workers can update own profile" on public.workers
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Hole 1: storage files may only be written by the user whose id starts the file name.
drop policy if exists "Authenticated users can upload photos" on storage.objects;
drop policy if exists "Workers can update own photos" on storage.objects;
drop policy if exists "worker_photos_owner_insert" on storage.objects;
drop policy if exists "worker_photos_owner_update" on storage.objects;
drop policy if exists "worker_photos_owner_delete" on storage.objects;

create policy "worker_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'worker-photos' and left(name, 36) = auth.uid()::text);
create policy "worker_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'worker-photos' and left(name, 36) = auth.uid()::text)
  with check (bucket_id = 'worker-photos' and left(name, 36) = auth.uid()::text);
create policy "worker_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'worker-photos' and left(name, 36) = auth.uid()::text);

-- Images only, max 10 MB per file.
update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  where id = 'worker-photos';

commit;
