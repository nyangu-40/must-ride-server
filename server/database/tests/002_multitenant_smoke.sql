-- Run against a migrated Supabase project as its SQL editor/postgres role.
-- Every fixture is inside a transaction and is rolled back at the end.
begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'tenant-a-smoke@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'tenant-b-smoke@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into public.profiles (user_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'organizer'),
  ('22222222-2222-4222-8222-222222222222', 'organizer')
on conflict (user_id) do update set role = excluded.role;

insert into public.organizers (id, owner_user_id, name, slug, active_until) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Smoke A', 'smoke-a', now() + interval '1 month'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Smoke B', 'smoke-b', now() + interval '1 month')
on conflict (id) do nothing;

insert into public.trips (id, organizer_id, title, origin, destination, price_per_seat, seat_count, pickup_locations, status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Smoke trip A', 'A', 'B', 10000, 5, array['A'], 'open'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Smoke trip B', 'A', 'B', 10000, 5, array['A'], 'open')
on conflict (id) do nothing;

do $$
declare
  v_paid public.registrations%rowtype;
  v_pending public.registrations%rowtype;
  v_payout public.payouts%rowtype;
  v_sale_count integer;
  v_reversal_count integer;
begin
  select * into v_paid from public.create_booking_and_hold(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Passenger A', '+265999000001', null, 'A',
    array['1'], jsonb_build_array(jsonb_build_object('seat', '1', 'name', 'Passenger A'))
  );
  select * into v_pending from public.create_booking_and_hold(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'Passenger B', '+265999000002', null, 'A',
    array['1'], jsonb_build_array(jsonb_build_object('seat', '1', 'name', 'Passenger B'))
  );

  begin
    perform public.delete_pending_registration(v_pending.id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    raise exception 'Registration with an active hold was unexpectedly deleted';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform public.create_booking_and_hold(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Passenger C', '+265999000003', null, 'A',
      array['1'], jsonb_build_array(jsonb_build_object('seat', '1', 'name', 'Passenger C'))
    );
    raise exception 'Double-booked seat was unexpectedly accepted';
  exception when unique_violation then
    null;
  end;

  perform public.mark_registration_paid(v_paid.id, v_paid.id::text, now());
  perform public.mark_registration_paid(v_paid.id, v_paid.id::text, now());
  select count(*) into v_sale_count from public.wallet_transactions
    where registration_id = v_paid.id and type = 'sale';
  if v_sale_count <> 1 then
    raise exception 'Paid registration produced % sale rows, expected 1', v_sale_count;
  end if;
  begin
    perform public.update_registration_seats(
      v_paid.id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', array['2'],
      jsonb_build_array(jsonb_build_object('seat', '2', 'name', 'Passenger A')), '{}'::jsonb
    );
    raise exception 'Paid registration seats were unexpectedly changed';
  exception when sqlstate '22023' then
    null;
  end;

  select * into v_payout from public.request_payout(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 10000, 'mobile_money', '{"phone":"test"}'
  );
  begin
    perform public.request_payout('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'mobile_money', '{"phone":"test"}');
    raise exception 'Oversized payout was unexpectedly accepted';
  exception when sqlstate '22023' then
    null;
  end;
  perform public.settle_payout(v_payout.id, 'paid');
  perform public.settle_payout(v_payout.id, 'failed');
  select count(*) into v_reversal_count from public.wallet_transactions
    where payout_id = v_payout.id and type = 'payout_reversal';
  if v_reversal_count <> 0 then
    raise exception 'A completed payout was incorrectly reversed';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
begin
  if not exists (select 1 from public.organizers where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Organizer A cannot see its own organizer row';
  end if;
  if exists (select 1 from public.organizers where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then
    raise exception 'Organizer A can see organizer B';
  end if;
  if exists (select 1 from public.registrations where organizer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then
    raise exception 'Organizer A can see organizer B registrations';
  end if;
end;
$$;
reset role;

rollback;
