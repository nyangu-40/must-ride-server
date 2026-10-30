begin;

alter table public.trips drop column if exists booking_image_url;

notify pgrst, 'reload schema';

commit;
