begin;

-- Trip presentation: cover photo, description and amenities shown on the public pages.
alter table public.trips
  add column if not exists cover_image_url text,
  add column if not exists description text,
  add column if not exists amenities text[] not null default '{}';

alter table public.trips drop constraint if exists trips_description_length_check;
alter table public.trips
  add constraint trips_description_length_check
  check (description is null or char_length(description) <= 600);

alter table public.trips drop constraint if exists trips_amenities_count_check;
alter table public.trips
  add constraint trips_amenities_count_check
  check (coalesce(array_length(amenities, 1), 0) <= 12);

-- Public bucket for trip cover images. Uploads go through the API (service role),
-- which always stores files under the uploading organiser's own folder.
insert into storage.buckets (id, name, public)
values ('trip-covers', 'trip-covers', true)
on conflict (id) do update set public = excluded.public;

-- Keep the original Mpoto Ride look for the default trip created by migration 002.
update public.trips t
set description = 'Travel with Mpoto Ride for comfortable student transport and fast online booking.',
    amenities = array['Comfortable seats', 'Charging ports', 'Snacks']
from public.organizers o
where o.id = t.organizer_id
  and o.slug = 'mpoto-ride'
  and t.description is null
  and coalesce(array_length(t.amenities, 1), 0) = 0;

notify pgrst, 'reload schema';

commit;
