begin;

drop view if exists public.wallet_balance;
drop function if exists public.settle_payout(uuid, text, text, jsonb);
drop function if exists public.extend_organizer_subscription(uuid, timestamptz, text, numeric, text, text, uuid);
drop function if exists public.platform_overview_metrics();
drop function if exists public.request_payout(uuid, numeric, text, jsonb);
drop function if exists public.mark_registration_paid(uuid, text, timestamptz);
drop function if exists public.update_registration_seats(uuid, uuid, text[], jsonb, jsonb);
drop function if exists public.delete_pending_registration(uuid, uuid);
drop function if exists public.create_booking_and_hold(uuid, text, text, text, text, text[], jsonb);

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

alter table public.profiles disable row level security;
alter table public.organizers disable row level security;
alter table public.trips disable row level security;
alter table public.registrations disable row level security;
alter table public.registration_seats disable row level security;
alter table public.wallet_transactions disable row level security;
alter table public.payouts disable row level security;
alter table public.subscriptions disable row level security;
alter table public.audit_log disable row level security;

drop table if exists public.audit_log;
drop table if exists public.subscriptions;
alter table public.wallet_transactions drop constraint if exists wallet_transactions_payout_id_fkey;
drop table if exists public.payouts;
drop table if exists public.wallet_transactions;
drop table if exists public.registration_seats;
alter table public.registrations drop constraint if exists registrations_trip_organizer_fkey;
alter table public.registrations drop constraint if exists registrations_id_trip_uidx;
alter table public.trips drop constraint if exists trips_id_organizer_uidx;
alter table public.registrations drop column if exists trip_id;
alter table public.registrations drop column if exists organizer_id;
alter table public.registrations drop column if exists email;
drop table if exists public.trips;
drop table if exists public.organizers;
drop table if exists public.profiles;
delete from storage.buckets b
where b.id = 'organizer-logos'
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

commit;
