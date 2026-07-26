-- Supabase table definition for MUST Ride registrations

-- If needed, enable the UUID extension:
-- create extension if not exists "pgcrypto";

create table registrations (
  id uuid default gen_random_uuid() primary key,
  fullname text not null,
  phone text not null,
  pickup_location text not null,
  destination text not null,
  seats int not null,
  selected_seats text[] not null default '{}',
  passengers jsonb not null default '[]',
  amount numeric not null,
  payment_status text not null default 'Pending',
  payment_reference text,
  payment_date timestamp,
  created_at timestamp not null default now()
);
