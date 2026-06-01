-- AI Core Radio Supabase setup
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  lyrics_notes text,
  audio_path text not null unique,
  audio_url text not null,
  cover_path text,
  cover_url text,
  file_size bigint not null check (file_size > 0),
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  donation_url text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, donation_url)
values (1, null)
on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_tracks_updated_at on public.tracks;
create trigger touch_tracks_updated_at
before update on public.tracks
for each row execute function public.touch_updated_at();

drop trigger if exists touch_settings_updated_at on public.app_settings;
create trigger touch_settings_updated_at
before update on public.app_settings
for each row execute function public.touch_updated_at();

alter table public.tracks enable row level security;
alter table public.app_settings enable row level security;
alter table public.app_admins enable row level security;

-- Public visitors may read tracks and settings.
drop policy if exists "Public can read tracks" on public.tracks;
create policy "Public can read tracks" on public.tracks
for select using (true);

drop policy if exists "Admins can insert tracks" on public.tracks;
create policy "Admins can insert tracks" on public.tracks
for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update tracks" on public.tracks;
create policy "Admins can update tracks" on public.tracks
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete tracks" on public.tracks;
create policy "Admins can delete tracks" on public.tracks
for delete to authenticated
using (public.is_admin());

drop policy if exists "Public can read settings" on public.app_settings;
create policy "Public can read settings" on public.app_settings
for select using (true);

drop policy if exists "Admins can update settings" on public.app_settings;
create policy "Admins can update settings" on public.app_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Only admins can view the admin allowlist.
drop policy if exists "Admins can read app_admins" on public.app_admins;
create policy "Admins can read app_admins" on public.app_admins
for select to authenticated
using (public.is_admin());

-- Storage buckets. Public buckets make streaming and free downloads simple.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('track-audio', 'track-audio', true, 524288000, array['audio/mpeg']),
  ('cover-art', 'cover-art', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: public read, admin write. Files are public by design for free streaming/downloads.
drop policy if exists "Public can read track audio" on storage.objects;
create policy "Public can read track audio" on storage.objects
for select using (bucket_id = 'track-audio');

drop policy if exists "Public can read cover art" on storage.objects;
create policy "Public can read cover art" on storage.objects
for select using (bucket_id = 'cover-art');

drop policy if exists "Admins can upload mp3" on storage.objects;
create policy "Admins can upload mp3" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'track-audio'
  and public.is_admin()
  and lower(storage.extension(name)) = 'mp3'
);

drop policy if exists "Admins can update mp3" on storage.objects;
create policy "Admins can update mp3" on storage.objects
for update to authenticated
using (bucket_id = 'track-audio' and public.is_admin())
with check (bucket_id = 'track-audio' and public.is_admin() and lower(storage.extension(name)) = 'mp3');

drop policy if exists "Admins can delete mp3" on storage.objects;
create policy "Admins can delete mp3" on storage.objects
for delete to authenticated
using (bucket_id = 'track-audio' and public.is_admin());

drop policy if exists "Admins can upload cover art" on storage.objects;
create policy "Admins can upload cover art" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'cover-art'
  and public.is_admin()
  and lower(storage.extension(name)) in ('png','jpg','jpeg','webp')
);

drop policy if exists "Admins can update cover art" on storage.objects;
create policy "Admins can update cover art" on storage.objects
for update to authenticated
using (bucket_id = 'cover-art' and public.is_admin())
with check (bucket_id = 'cover-art' and public.is_admin() and lower(storage.extension(name)) in ('png','jpg','jpeg','webp'));

drop policy if exists "Admins can delete cover art" on storage.objects;
create policy "Admins can delete cover art" on storage.objects
for delete to authenticated
using (bucket_id = 'cover-art' and public.is_admin());

-- After creating your admin user in Supabase Auth, run this with that user's UUID:
-- insert into public.app_admins (user_id) values ('YOUR-AUTH-USER-UUID');
