-- Run against a project after migrations 002 and 003.
-- Fixtures are rolled back at the end.
begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
  'applicant-smoke@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.profiles (user_id, role)
values ('33333333-3333-4333-8333-333333333333', 'organizer');

insert into public.organizers (
  id, owner_user_id, owner_name, owner_email, name, slug, contact_phone, status
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '33333333-3333-4333-8333-333333333333',
  'Smoke Applicant', 'applicant-smoke@example.invalid', 'Smoke Applicant Company',
  'signup-smoke', '+265999000003', 'pending'
);

insert into public.trips (
  id, organizer_id, title, origin, destination, price_per_seat, seat_count,
  pickup_locations, status, price_mode, min_amount, max_amount
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Flexible smoke trip', 'A', 'B', 3000, 5, array['A'], 'open', 'flexible', 2000, 5000
);

do $$
declare
  v_organizer public.organizers%rowtype;
  v_registration public.registrations%rowtype;
  v_sale_count integer;
  v_subscription_count integer;
  v_audit_count integer;
begin
  begin
    insert into public.organizers (name, slug, status)
    values ('Reserved slug smoke', 'platform', 'pending');
    raise exception 'Reserved slug was unexpectedly accepted';
  exception when check_violation then
    null;
  end;

  select * into v_organizer from public.approve_organizer_application(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc', now() + interval '1 month',
    10000, 'manual', 'Smoke approval', '33333333-3333-4333-8333-333333333333'
  );
  if v_organizer.status <> 'active' or v_organizer.active_until <= now() then
    raise exception 'Application was not activated';
  end if;
  select count(*) into v_subscription_count from public.subscriptions
    where organizer_id = v_organizer.id and amount = 10000;
  select count(*) into v_audit_count from public.audit_log
    where target_id = v_organizer.id::text and action = 'organizer_application_approved';
  if v_subscription_count <> 1 or v_audit_count <> 1 then
    raise exception 'Approval did not create its subscription and audit row';
  end if;

  begin
    perform public.create_flexible_booking_and_hold(
      'cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'Too low', '+265999000004', null, 'A',
      array['1'], jsonb_build_array(jsonb_build_object('seat', '1', 'name', 'Too low')), 1999
    );
    raise exception 'Below-minimum flexible price was accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.create_flexible_booking_and_hold(
      'cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'Too high', '+265999000005', null, 'A',
      array['1'], jsonb_build_array(jsonb_build_object('seat', '1', 'name', 'Too high')), 5001
    );
    raise exception 'Above-maximum flexible price was accepted';
  exception when sqlstate '22023' then
    null;
  end;

  select * into v_registration from public.create_flexible_booking_and_hold(
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'Paid passenger', '+265999000006', null, 'A',
    array['1', '2'], jsonb_build_array(
      jsonb_build_object('seat', '1', 'name', 'Passenger One'),
      jsonb_build_object('seat', '2', 'name', 'Passenger Two')
    ), 2500
  );
  if v_registration.amount is distinct from 5000
     or v_registration.chosen_amount_per_seat is distinct from 2500 then
    raise exception 'Flexible per-seat amount was not persisted correctly';
  end if;
  perform public.mark_registration_paid(v_registration.id, v_registration.id::text, now());
  perform public.mark_registration_paid(v_registration.id, v_registration.id::text, now());
  select count(*) into v_sale_count from public.wallet_transactions
    where registration_id = v_registration.id and type = 'sale' and amount = 5000;
  if v_sale_count <> 1 then
    raise exception 'Expected one ledger sale for the exact 5000 MWK booking amount';
  end if;
end;
$$;

rollback;
