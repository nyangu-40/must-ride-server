begin;

-- Second trip photo: shown at the top of the booking (registration) page,
-- e.g. the inside of the bus. cover_image_url stays the landing/organizer page photo.
alter table public.trips
  add column if not exists booking_image_url text;

notify pgrst, 'reload schema';

commit;
