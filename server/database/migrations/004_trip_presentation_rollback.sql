begin;

alter table public.trips drop constraint if exists trips_description_length_check;
alter table public.trips drop constraint if exists trips_amenities_count_check;
alter table public.trips
  drop column if exists cover_image_url,
  drop column if exists description,
  drop column if exists amenities;

-- The 'trip-covers' storage bucket is left in place on purpose (it may contain files).
-- Delete it from Storage in the Supabase dashboard if you really want it gone.

notify pgrst, 'reload schema';

commit;
