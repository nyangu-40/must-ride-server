begin;

alter table public.organizers
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists rejection_reason text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.organizers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.organizers drop constraint %I', v_constraint.conname);
  end loop;
end;
$$;

alter table public.organizers
  add constraint organizers_status_check
  check (status in ('pending', 'active', 'suspended', 'rejected'));

alter table public.organizers
  drop constraint if exists organizers_slug_not_reserved_check;
alter table public.organizers
  add constraint organizers_slug_not_reserved_check
  check (slug <> all(array[
    'platform', 'dashboard', 'login', 'signup', 'admin', 'api', 'o', 'receipt',
    'webhook', 'register', 'become-organizer', 'help', 'terms', 'privacy'
  ]::text[]));

alter table public.trips
  add column if not exists price_mode text not null default 'fixed',
  add column if not exists min_amount numeric(12, 2),
  add column if not exists max_amount numeric(12, 2);

alter table public.trips
  drop constraint if exists trips_price_mode_check,
  drop constraint if exists trips_min_amount_check,
  drop constraint if exists trips_max_amount_check,
  drop constraint if exists trips_flexible_price_bounds_check;
alter table public.trips
  add constraint trips_price_mode_check check (price_mode in ('fixed', 'flexible')),
  add constraint trips_min_amount_check check (min_amount is null or min_amount >= 0),
  add constraint trips_max_amount_check check (max_amount is null or max_amount >= 0),
  add constraint trips_flexible_price_bounds_check
    check (max_amount is null or min_amount is null or max_amount >= min_amount);

alter table public.registrations
  add column if not exists chosen_amount_per_seat numeric(12, 2);

update public.registrations
set chosen_amount_per_seat = amount / nullif(seats, 0)
where chosen_amount_per_seat is null and seats > 0;

create or replace function public.create_flexible_booking_and_hold(
  p_trip_id uuid,
  p_fullname text,
  p_phone text,
  p_email text,
  p_pickup_location text,
  p_seats text[],
  p_passengers jsonb,
  p_chosen_amount_per_seat numeric
)
returns public.registrations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trip public.trips%rowtype;
  v_registration public.registrations%rowtype;
begin
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found or v_trip.price_mode <> 'flexible' then
    raise exception 'Trip does not accept passenger-selected pricing' using errcode = '22023';
  end if;
  if p_chosen_amount_per_seat is null
     or p_chosen_amount_per_seat <> trunc(p_chosen_amount_per_seat)
     or p_chosen_amount_per_seat < greatest(coalesce(v_trip.min_amount, 100), 100)
     or (v_trip.max_amount is not null and p_chosen_amount_per_seat > v_trip.max_amount) then
    raise exception 'Selected amount is outside this trip price range' using errcode = '22023';
  end if;

  v_registration := public.create_booking_and_hold(
    p_trip_id, p_fullname, p_phone, p_email, p_pickup_location, p_seats, p_passengers
  );
  update public.registrations
  set amount = p_chosen_amount_per_seat * cardinality(p_seats),
      chosen_amount_per_seat = p_chosen_amount_per_seat
  where id = v_registration.id
  returning * into v_registration;
  return v_registration;
end;
$$;

create or replace function public.approve_organizer_application(
  p_organizer_id uuid,
  p_active_until timestamptz,
  p_amount numeric,
  p_method text,
  p_note text,
  p_approved_by uuid
)
returns public.organizers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer public.organizers%rowtype;
  v_period_start timestamptz := now();
begin
  select * into v_organizer
  from public.organizers
  where id = p_organizer_id
  for update;
  if not found then
    raise exception 'Organizer application not found' using errcode = 'P0002';
  end if;
  if v_organizer.status not in ('pending', 'rejected') then
    raise exception 'Only pending or rejected applications can be approved' using errcode = '22023';
  end if;
  if p_active_until <= v_period_start or p_amount < 0
     or p_method is null or length(trim(p_method)) = 0 then
    raise exception 'Invalid approval subscription details' using errcode = '22023';
  end if;

  update public.organizers
  set status = 'active',
      active_until = p_active_until,
      approved_at = now(),
      approved_by = p_approved_by,
      rejection_reason = null
  where id = p_organizer_id
  returning * into v_organizer;

  insert into public.subscriptions (
    organizer_id, amount, method, note, period_start, period_end, recorded_by
  ) values (
    p_organizer_id, p_amount, p_method, p_note, v_period_start, p_active_until, p_approved_by
  );
  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    p_approved_by, 'organizer_application_approved', 'organizer', p_organizer_id::text,
    jsonb_build_object('active_until', p_active_until, 'amount', p_amount, 'method', p_method)
  );
  return v_organizer;
end;
$$;

create or replace function public.reject_organizer_application(
  p_organizer_id uuid,
  p_reason text,
  p_rejected_by uuid
)
returns public.organizers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer public.organizers%rowtype;
begin
  select * into v_organizer
  from public.organizers
  where id = p_organizer_id
  for update;
  if not found then
    raise exception 'Organizer application not found' using errcode = 'P0002';
  end if;
  if v_organizer.status not in ('pending', 'rejected') then
    raise exception 'Only pending or rejected applications can be rejected' using errcode = '22023';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  update public.organizers
  set status = 'rejected',
      rejection_reason = trim(p_reason),
      approved_at = null,
      approved_by = null
  where id = p_organizer_id
  returning * into v_organizer;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    p_rejected_by, 'organizer_application_rejected', 'organizer', p_organizer_id::text,
    jsonb_build_object('reason', trim(p_reason))
  );
  return v_organizer;
end;
$$;

revoke all on function public.create_flexible_booking_and_hold(uuid, text, text, text, text, text[], jsonb, numeric) from public, anon, authenticated;
revoke all on function public.approve_organizer_application(uuid, timestamptz, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.reject_organizer_application(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.create_flexible_booking_and_hold(uuid, text, text, text, text, text[], jsonb, numeric) to service_role;
grant execute on function public.approve_organizer_application(uuid, timestamptz, numeric, text, text, uuid) to service_role;
grant execute on function public.reject_organizer_application(uuid, text, uuid) to service_role;

commit;
