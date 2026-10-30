begin;

alter table public.trips drop constraint if exists trips_seat_layout_check;
alter table public.trips drop column if exists seat_layout;

notify pgrst, 'reload schema';

commit;
