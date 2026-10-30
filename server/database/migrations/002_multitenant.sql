begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('organizer', 'superadmin')),
  created_at timestamptz not null default now()
);

create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#059669',
  tagline text,
  contact_phone text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  subscription_plan text not null default 'monthly',
  active_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  title text not null,
  origin text not null,
  destination text not null,
  departure_at timestamptz,
  price_per_seat numeric(12, 2) not null check (price_per_seat >= 0),
  seat_count integer not null check (seat_count > 0),
  pickup_locations text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trips_id_organizer_uidx' and conrelid = 'public.trips'::regclass
  ) then
    alter table public.trips add constraint trips_id_organizer_uidx unique (id, organizer_id);
  end if;
end;
$$;

alter table public.registrations
  add column if not exists organizer_id uuid references public.organizers(id),
  add column if not exists trip_id uuid references public.trips(id),
  add column if not exists email text;

create table if not exists public.registration_seats (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  seat_label text not null,
  status text not null check (status in ('held', 'paid', 'released')),
  hold_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists registration_seats_active_trip_seat_uidx
  on public.registration_seats (trip_id, seat_label)
  where status in ('held', 'paid');

create index if not exists registration_seats_registration_idx
  on public.registration_seats (registration_id);
create index if not exists registration_seats_trip_status_idx
  on public.registration_seats (trip_id, status, hold_expires_at);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  type text not null check (type in ('sale', 'payout', 'payout_reversal', 'adjustment')),
  amount numeric(12, 2) not null,
  registration_id uuid references public.registrations(id) on delete set null,
  payout_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_transactions_registration_type_uidx
  on public.wallet_transactions (registration_id, type)
  where registration_id is not null;
create unique index if not exists wallet_transactions_payout_type_uidx
  on public.wallet_transactions (payout_id, type)
  where payout_id is not null;
create index if not exists wallet_transactions_organizer_created_idx
  on public.wallet_transactions (organizer_id, created_at desc);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('mobile_money', 'bank')),
  destination jsonb not null,
  status text not null default 'requested' check (status in ('requested', 'processing', 'paid', 'failed')),
  paychangu_ref text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'wallet_transactions_payout_id_fkey'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_payout_id_fkey
      foreign key (payout_id) references public.payouts(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  method text not null,
  note text,
  period_start timestamptz not null,
  period_end timestamptz not null,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end > period_start)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('organizer-logos', 'organizer-logos', true)
on conflict (id) do update set public = excluded.public;

create index if not exists trips_organizer_status_departure_idx
  on public.trips (organizer_id, status, departure_at);
create index if not exists registrations_organizer_trip_created_idx
  on public.registrations (organizer_id, trip_id, created_at desc);
create index if not exists payouts_organizer_created_idx
  on public.payouts (organizer_id, created_at desc);
create index if not exists subscriptions_organizer_period_idx
  on public.subscriptions (organizer_id, period_end desc);

insert into public.organizers (name, slug, primary_color, subscription_plan, active_until)
values ('Mpoto Ride', 'mpoto-ride', '#059669', 'monthly', null)
on conflict (slug) do nothing;

insert into public.trips (
  organizer_id, title, origin, destination, departure_at, price_per_seat, seat_count,
  pickup_locations, status
)
select o.id, 'Mpoto Ride to MUST', 'Mzuzu Depot', 'MUST', null,
       coalesce(nullif(current_setting('app.price_per_seat', true), '')::numeric, 10000),
       66, array['Mzuzu Depot', 'Mzimba Boma', 'Jenda', 'Champhila']::text[], 'open'
from public.organizers o
where o.slug = 'mpoto-ride'
  and not exists (
    select 1 from public.trips t
    where t.organizer_id = o.id and t.title = 'Mpoto Ride to MUST'
  );

update public.registrations r
set organizer_id = o.id,
    trip_id = t.id
from public.organizers o
join public.trips t on t.organizer_id = o.id and t.title = 'Mpoto Ride to MUST'
where o.slug = 'mpoto-ride'
  and (r.organizer_id is null or r.trip_id is null);

alter table public.registrations
  alter column organizer_id set not null,
  alter column trip_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'registrations_id_trip_uidx' and conrelid = 'public.registrations'::regclass
  ) then
    alter table public.registrations add constraint registrations_id_trip_uidx unique (id, trip_id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'registrations_trip_organizer_fkey' and conrelid = 'public.registrations'::regclass
  ) then
    alter table public.registrations
      add constraint registrations_trip_organizer_fkey
      foreign key (trip_id, organizer_id) references public.trips (id, organizer_id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'registration_seats_registration_trip_fkey' and conrelid = 'public.registration_seats'::regclass
  ) then
    alter table public.registration_seats
      add constraint registration_seats_registration_trip_fkey
      foreign key (registration_id, trip_id) references public.registrations (id, trip_id) on delete cascade;
  end if;
end;
$$;

create index if not exists registrations_organizer_id_idx on public.registrations (organizer_id);
create index if not exists registrations_trip_id_idx on public.registrations (trip_id);

insert into public.registration_seats (registration_id, trip_id, seat_label, status, hold_expires_at)
select r.id, r.trip_id, seat.label, 'paid', null
from public.registrations r
cross join lateral unnest(coalesce(r.selected_seats, '{}'::text[])) as seat(label)
where r.payment_status = 'Paid'
  and not exists (
    select 1 from public.registration_seats rs
    where rs.trip_id = r.trip_id and rs.seat_label = seat.label and rs.status = 'paid'
  )
on conflict do nothing;

insert into public.wallet_transactions (organizer_id, type, amount, registration_id, note)
select r.organizer_id, 'sale', r.amount, r.id, 'Backfilled paid registration'
from public.registrations r
where r.payment_status = 'Paid'
on conflict do nothing;

create or replace view public.wallet_balance with (security_invoker = true) as
select o.id as organizer_id,
       coalesce(sum(wt.amount), 0)::numeric(12, 2) as balance
from public.organizers o
left join public.wallet_transactions wt on wt.organizer_id = o.id
group by o.id;

create or replace function public.create_booking_and_hold(
  p_trip_id uuid,
  p_fullname text,
  p_phone text,
  p_email text,
  p_pickup_location text,
  p_seats text[],
  p_passengers jsonb
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
  select * into v_trip
  from public.trips
  where id = p_trip_id
  for update;

  if not found or v_trip.status <> 'open' then
    raise exception 'Trip is not available for booking' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.organizers o
    where o.id = v_trip.organizer_id
      and o.status = 'active'
      and (o.active_until is null or o.active_until > now())
  ) then
    raise exception 'Bookings are currently closed' using errcode = 'P0001';
  end if;
  if coalesce(array_length(p_seats, 1), 0) = 0
     or array_length(p_seats, 1) <> (select count(distinct s) from unnest(p_seats) s) then
    raise exception 'Select unique seats' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_seats) s
    where s !~ '^[1-9][0-9]*$' or s::integer > v_trip.seat_count
  ) then
    raise exception 'Invalid seat selection' using errcode = '22023';
  end if;
  if not (p_pickup_location = any(v_trip.pickup_locations)) then
    raise exception 'Invalid pickup location' using errcode = '22023';
  end if;
  if jsonb_typeof(p_passengers) is distinct from 'array' then
    raise exception 'Provide one passenger name for each selected seat' using errcode = '22023';
  end if;
  if jsonb_array_length(p_passengers) <> cardinality(p_seats)
     or exists (
       select 1 from unnest(p_seats) selected(seat)
       where not exists (
         select 1 from jsonb_array_elements(p_passengers) passenger
         where passenger->>'seat' = selected.seat
       )
     ) then
    raise exception 'Provide one passenger name for each selected seat' using errcode = '22023';
  end if;

  update public.registration_seats
  set status = 'released'
  where trip_id = p_trip_id and status = 'held' and hold_expires_at <= now();

  insert into public.registrations (
    organizer_id, trip_id, fullname, phone, email, pickup_location, destination,
    seats, selected_seats, passengers, amount, payment_status,
    payment_reference, payment_date
  )
  values (
    v_trip.organizer_id, v_trip.id, p_fullname, p_phone, p_email, p_pickup_location,
    v_trip.destination, cardinality(p_seats), p_seats, p_passengers,
    v_trip.price_per_seat * cardinality(p_seats), 'Pending', null, null
  )
  returning * into v_registration;

  insert into public.registration_seats
    (registration_id, trip_id, seat_label, status, hold_expires_at)
  select v_registration.id, v_trip.id, s, 'held', now() + interval '10 minutes'
  from unnest(p_seats) s;

  return v_registration;
end;
$$;

create or replace function public.update_registration_seats(
  p_registration_id uuid,
  p_organizer_id uuid,
  p_selected_seats text[],
  p_passengers jsonb,
  p_details jsonb
)
returns public.registrations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_registration public.registrations%rowtype;
  v_trip public.trips%rowtype;
  v_seat_status text;
  v_hold_expires_at timestamptz;
begin
  select * into v_registration
  from public.registrations
  where id = p_registration_id and organizer_id = p_organizer_id
  for update;
  if not found then
    raise exception 'Registration not found' using errcode = 'P0002';
  end if;
  if v_registration.payment_status = 'Paid' then
    raise exception 'Paid registrations cannot change seats' using errcode = '22023';
  end if;
  select * into v_trip from public.trips where id = v_registration.trip_id;
  if coalesce(array_length(p_selected_seats, 1), 0) = 0
     or array_length(p_selected_seats, 1) <> (select count(distinct s) from unnest(p_selected_seats) s) then
    raise exception 'Select unique seats' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_selected_seats) s
    where s !~ '^[1-9][0-9]*$' or s::integer > v_trip.seat_count
  ) then
    raise exception 'Invalid seat selection' using errcode = '22023';
  end if;
  if jsonb_typeof(p_passengers) is distinct from 'array' then
    raise exception 'Provide one passenger name for each selected seat' using errcode = '22023';
  end if;
  if jsonb_array_length(p_passengers) <> cardinality(p_selected_seats)
     or exists (
       select 1 from unnest(p_selected_seats) selected(seat)
       where not exists (
         select 1 from jsonb_array_elements(p_passengers) passenger
         where passenger->>'seat' = selected.seat
       )
     ) then
    raise exception 'Provide one passenger name for each selected seat' using errcode = '22023';
  end if;
  if p_details ? 'pickup_location'
     and not ((p_details->>'pickup_location') = any(v_trip.pickup_locations)) then
    raise exception 'Invalid pickup location' using errcode = '22023';
  end if;

  v_seat_status := case when v_registration.payment_status = 'Paid' then 'paid' else 'held' end;
  v_hold_expires_at := case when v_seat_status = 'held' then now() + interval '10 minutes' else null end;
  update public.registration_seats
  set status = 'released'
  where trip_id = v_registration.trip_id and status = 'held' and hold_expires_at <= now();
  update public.registration_seats
  set status = 'released'
  where registration_id = p_registration_id and status in ('held', 'paid');

  insert into public.registration_seats
    (registration_id, trip_id, seat_label, status, hold_expires_at)
  select p_registration_id, v_registration.trip_id, s, v_seat_status, v_hold_expires_at
  from unnest(p_selected_seats) s;

  update public.registrations
  set selected_seats = p_selected_seats,
      seats = cardinality(p_selected_seats),
      amount = v_trip.price_per_seat * cardinality(p_selected_seats),
      passengers = p_passengers,
      fullname = coalesce(p_details->>'fullname', fullname),
      phone = coalesce(p_details->>'phone', phone),
      email = case when p_details ? 'email' then nullif(p_details->>'email', '') else email end,
      pickup_location = coalesce(p_details->>'pickup_location', pickup_location)
  where id = p_registration_id
  returning * into v_registration;

  if v_registration.payment_status = 'Paid' then
    update public.wallet_transactions
    set amount = v_registration.amount
    where registration_id = p_registration_id and type = 'sale';
  end if;

  return v_registration;
end;
$$;

create or replace function public.delete_pending_registration(
  p_registration_id uuid,
  p_organizer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_registration public.registrations%rowtype;
begin
  select * into v_registration
  from public.registrations
  where id = p_registration_id and organizer_id = p_organizer_id
  for update;
  if not found then
    raise exception 'Registration not found' using errcode = 'P0002';
  end if;
  if v_registration.payment_status = 'Paid' then
    raise exception 'Paid registrations cannot be deleted' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.registration_seats
    where registration_id = p_registration_id and status = 'held' and hold_expires_at > now()
  ) then
    raise exception 'Registration has an active checkout hold' using errcode = '22023';
  end if;
  delete from public.registrations where id = p_registration_id;
  return true;
end;
$$;

create or replace function public.mark_registration_paid(
  p_registration_id uuid,
  p_payment_reference text,
  p_payment_date timestamptz default now()
)
returns public.registrations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_registration public.registrations%rowtype;
begin
  select * into v_registration
  from public.registrations
  where id = p_registration_id
  for update;
  if not found then
    raise exception 'Registration not found' using errcode = 'P0002';
  end if;
  if v_registration.payment_status = 'Paid' then
    return v_registration;
  end if;
  if not exists (
    select 1 from public.registration_seats rs
    where rs.registration_id = v_registration.id
      and rs.status = 'held' and rs.hold_expires_at > now()
  ) then
    raise exception 'Seat hold has expired' using errcode = 'P0001';
  end if;

  update public.registrations
  set payment_status = 'Paid',
      payment_reference = p_payment_reference,
      payment_date = p_payment_date
  where id = p_registration_id
  returning * into v_registration;

  update public.registration_seats
  set status = 'paid', hold_expires_at = null
  where registration_id = p_registration_id and status = 'held';

  insert into public.wallet_transactions (organizer_id, type, amount, registration_id, note)
  values (v_registration.organizer_id, 'sale', v_registration.amount, v_registration.id, 'Paid registration')
  on conflict do nothing;

  return v_registration;
end;
$$;

create or replace function public.request_payout(
  p_organizer_id uuid,
  p_amount numeric,
  p_method text,
  p_destination jsonb
)
returns public.payouts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payout public.payouts%rowtype;
  v_balance numeric(12, 2);
begin
  perform 1 from public.organizers where id = p_organizer_id for update;
  if not found then
    raise exception 'Organizer not found' using errcode = 'P0002';
  end if;
  if p_amount <= 0 or p_method not in ('mobile_money', 'bank') then
    raise exception 'Invalid payout request' using errcode = '22023';
  end if;

  select coalesce(sum(wt.amount), 0) -
         coalesce((select sum(p.amount) from public.payouts p
                   where p.organizer_id = p_organizer_id
                     and p.status in ('requested', 'processing')), 0)
  into v_balance
  from public.wallet_transactions wt
  where wt.organizer_id = p_organizer_id;

  if p_amount > v_balance then
    raise exception 'Payout exceeds available balance' using errcode = '22023';
  end if;

  insert into public.payouts (organizer_id, amount, method, destination)
  values (p_organizer_id, p_amount, p_method, p_destination)
  returning * into v_payout;
  return v_payout;
end;
$$;

create or replace function public.settle_payout(
  p_payout_id uuid,
  p_status text,
  p_paychangu_ref text default null,
  p_raw_response jsonb default null
)
returns public.payouts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payout public.payouts%rowtype;
begin
  select * into v_payout from public.payouts where id = p_payout_id for update;
  if not found then
    raise exception 'Payout not found' using errcode = 'P0002';
  end if;
  if p_status not in ('processing', 'paid', 'failed') then
    raise exception 'Invalid payout status' using errcode = '22023';
  end if;
  if v_payout.status = 'paid' and p_status <> 'paid' then
    return v_payout;
  end if;

  update public.payouts
  set status = p_status, paychangu_ref = coalesce(p_paychangu_ref, paychangu_ref),
      raw_response = coalesce(p_raw_response, raw_response), updated_at = now()
  where id = p_payout_id
  returning * into v_payout;

  if p_status = 'paid' then
    insert into public.wallet_transactions (organizer_id, type, amount, payout_id, note)
    values (v_payout.organizer_id, 'payout', -v_payout.amount, v_payout.id, 'Payout completed')
    on conflict do nothing;
  elsif p_status = 'failed' then
    insert into public.wallet_transactions (organizer_id, type, amount, payout_id, note)
    select v_payout.organizer_id, 'payout_reversal', v_payout.amount, v_payout.id, 'Failed payout reversal'
    where exists (
      select 1 from public.wallet_transactions wt
      where wt.payout_id = v_payout.id and wt.type = 'payout'
    )
    on conflict do nothing;
  end if;

  return v_payout;
end;
$$;

create or replace function public.extend_organizer_subscription(
  p_organizer_id uuid,
  p_active_until timestamptz,
  p_plan text,
  p_amount numeric,
  p_method text,
  p_note text,
  p_recorded_by uuid
)
returns public.organizers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer public.organizers%rowtype;
  v_period_start timestamptz;
begin
  select * into v_organizer from public.organizers where id = p_organizer_id for update;
  if not found then
    raise exception 'Organizer not found' using errcode = 'P0002';
  end if;
  v_period_start := case
    when v_organizer.active_until is not null and v_organizer.active_until > now() then v_organizer.active_until
    else now()
  end;
  if p_active_until <= v_period_start or p_amount < 0 or p_method is null or length(trim(p_method)) = 0 then
    raise exception 'Invalid subscription extension' using errcode = '22023';
  end if;

  update public.organizers
  set active_until = p_active_until,
      subscription_plan = coalesce(p_plan, subscription_plan)
  where id = p_organizer_id
  returning * into v_organizer;

  insert into public.subscriptions (
    organizer_id, amount, method, note, period_start, period_end, recorded_by
  ) values (
    p_organizer_id, p_amount, p_method, p_note, v_period_start, p_active_until, p_recorded_by
  );
  return v_organizer;
end;
$$;

create or replace function public.platform_overview_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  with daily_bookings as (
    select created_at::date as day, count(*)::integer as bookings
    from public.registrations
    where created_at >= current_date - interval '29 days'
    group by created_at::date
  ),
  daily_sales as (
    select created_at::date as day, sum(amount)::numeric(14, 2) as revenue
    from public.wallet_transactions
    where type = 'sale' and created_at >= current_date - interval '29 days'
    group by created_at::date
  ),
  organizer_metrics as (
    select count(*)::integer as total,
      count(*) filter (where status = 'active' and (active_until is null or active_until > now()))::integer as active,
      count(*) filter (where status = 'suspended')::integer as suspended,
      count(*) filter (where status = 'active' and active_until <= now())::integer as expired
    from public.organizers
  ),
  registration_metrics as (
    select count(*)::integer as total,
      count(*) filter (where payment_status = 'Paid')::integer as paid,
      count(*) filter (where payment_status = 'Pending')::integer as pending
    from public.registrations
  ),
  ledger_metrics as (
    select coalesce(sum(amount) filter (where type = 'sale'), 0)::numeric(14, 2) as revenue,
      coalesce(sum(amount), 0)::numeric(14, 2) as owed,
      coalesce(-sum(amount) filter (where type = 'payout'), 0)::numeric(14, 2) as paid_out
    from public.wallet_transactions
  ),
  payout_metrics as (
    select coalesce(sum(amount) filter (where status in ('requested', 'processing')), 0)::numeric(14, 2) as pending
    from public.payouts
  )
  select jsonb_build_object(
    'organizers', (select to_jsonb(organizer_metrics) from organizer_metrics),
    'trips', (select count(*)::integer from public.trips),
    'registrations', (select to_jsonb(registration_metrics) from registration_metrics),
    'total_revenue_processed', (select revenue from ledger_metrics),
    'total_owed_to_organizers', (select owed from ledger_metrics),
    'total_paid_out', (select paid_out from ledger_metrics),
    'pending_payouts', (select pending from payout_metrics),
    'time_series', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', calendar.day::date,
        'bookings', coalesce(daily_bookings.bookings, 0),
        'revenue', coalesce(daily_sales.revenue, 0)
      ) order by calendar.day), '[]'::jsonb)
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') as calendar(day)
      left join daily_bookings on daily_bookings.day = calendar.day::date
      left join daily_sales on daily_sales.day = calendar.day::date
    )
  );
$$;

revoke all on function public.create_booking_and_hold(uuid, text, text, text, text, text[], jsonb) from public, anon, authenticated;
revoke all on function public.update_registration_seats(uuid, uuid, text[], jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.delete_pending_registration(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mark_registration_paid(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.request_payout(uuid, numeric, text, jsonb) from public, anon, authenticated;
revoke all on function public.settle_payout(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.extend_organizer_subscription(uuid, timestamptz, text, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.platform_overview_metrics() from public, anon, authenticated;
grant execute on function public.create_booking_and_hold(uuid, text, text, text, text, text[], jsonb) to service_role;
grant execute on function public.update_registration_seats(uuid, uuid, text[], jsonb, jsonb) to service_role;
grant execute on function public.delete_pending_registration(uuid, uuid) to service_role;
grant execute on function public.mark_registration_paid(uuid, text, timestamptz) to service_role;
grant execute on function public.request_payout(uuid, numeric, text, jsonb) to service_role;
grant execute on function public.settle_payout(uuid, text, text, jsonb) to service_role;
grant execute on function public.extend_organizer_subscription(uuid, timestamptz, text, numeric, text, text, uuid) to service_role;
grant execute on function public.platform_overview_metrics() to service_role;

alter table public.profiles enable row level security;
alter table public.organizers enable row level security;
alter table public.trips enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_seats enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payouts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "organizers read own organizer" on public.organizers;
drop policy if exists "public read active organizer branding" on public.organizers;
drop policy if exists "organizers read own trips" on public.trips;
drop policy if exists "public read open trips" on public.trips;
drop policy if exists "organizers read own registrations" on public.registrations;
drop policy if exists "organizers read own seats" on public.registration_seats;
drop policy if exists "organizers read own ledger" on public.wallet_transactions;
drop policy if exists "organizers read own payouts" on public.payouts;
drop policy if exists "organizers read own subscriptions" on public.subscriptions;
drop policy if exists "superadmins read audit log" on public.audit_log;

create policy "users read own profile" on public.profiles for select to authenticated
  using (user_id = auth.uid());
create policy "organizers read own organizer" on public.organizers for select to authenticated
  using (owner_user_id = auth.uid());
create policy "public read active organizer branding" on public.organizers for select to anon
  using (status = 'active');
create policy "organizers read own trips" on public.trips for select to authenticated
  using (organizer_id in (select id from public.organizers where owner_user_id = auth.uid()));
create policy "public read open trips" on public.trips for select to anon
  using (
    status = 'open'
    and organizer_id in (
      select id from public.organizers
      where status = 'active' and (active_until is null or active_until > now())
    )
  );
create policy "organizers read own registrations" on public.registrations for select to authenticated
  using (organizer_id in (select id from public.organizers where owner_user_id = auth.uid()));
create policy "organizers read own seats" on public.registration_seats for select to authenticated
  using (trip_id in (select id from public.trips where organizer_id in
    (select id from public.organizers where owner_user_id = auth.uid())));
create policy "organizers read own ledger" on public.wallet_transactions for select to authenticated
  using (organizer_id in (select id from public.organizers where owner_user_id = auth.uid()));
create policy "organizers read own payouts" on public.payouts for select to authenticated
  using (organizer_id in (select id from public.organizers where owner_user_id = auth.uid()));
create policy "organizers read own subscriptions" on public.subscriptions for select to authenticated
  using (organizer_id in (select id from public.organizers where owner_user_id = auth.uid()));
create policy "superadmins read audit log" on public.audit_log for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

commit;
