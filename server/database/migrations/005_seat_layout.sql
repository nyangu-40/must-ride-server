begin;

-- Bus seat layout per trip: '2+3' (2 seats, aisle, 3 seats) or '2+2' (2 seats, aisle, 2 seats).
-- Existing trips keep '2+3', which is the layout the booking page already used.
alter table public.trips
  add column if not exists seat_layout text not null default '2+3';

alter table public.trips drop constraint if exists trips_seat_layout_check;
alter table public.trips
  add constraint trips_seat_layout_check check (seat_layout in ('2+2', '2+3'));

notify pgrst, 'reload schema';

commit;
