begin;

drop function if exists public.reject_organizer_application(uuid, text, uuid);
drop function if exists public.approve_organizer_application(uuid, timestamptz, numeric, text, text, uuid);
drop function if exists public.create_flexible_booking_and_hold(uuid, text, text, text, text, text[], jsonb, numeric);

update public.organizers
set status = 'suspended'
where status in ('pending', 'rejected');

alter table public.organizers
  drop constraint if exists organizers_status_check,
  drop constraint if exists organizers_slug_not_reserved_check,
  add constraint organizers_status_check check (status in ('active', 'suspended'));

alter table public.organizers
  drop column if exists owner_name,
  drop column if exists owner_email,
  drop column if exists rejection_reason,
  drop column if exists approved_at,
  drop column if exists approved_by;

alter table public.trips
  drop constraint if exists trips_price_mode_check,
  drop constraint if exists trips_min_amount_check,
  drop constraint if exists trips_max_amount_check,
  drop constraint if exists trips_flexible_price_bounds_check,
  drop column if exists price_mode,
  drop column if exists min_amount,
  drop column if exists max_amount;

alter table public.registrations
  drop column if exists chosen_amount_per_seat;

commit;
