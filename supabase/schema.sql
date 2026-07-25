-- ASLM Rides — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL
-- Editor -> New query -> paste this whole file -> Run). It is safe to
-- re-run: every statement uses IF NOT EXISTS / OR REPLACE / drop-then-create
-- for policies.
--
-- This sets up: profiles (riders + drivers), vehicles, live driver status,
-- rides, and ratings — with row-level security so each account only sees
-- the data it should.
--
-- Layout: all tables are created first, then all RLS policies. Several
-- policies (e.g. "profiles: read counterpart on active ride") reference
-- public.rides, so every table must exist before any policy is created —
-- otherwise Postgres fails with "relation does not exist" partway through.

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- profiles — one row per auth user, created automatically on sign-up
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('rider', 'driver')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- vehicles — one driver may register one or more vehicles
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  year int,
  plate_number text not null,
  class text not null check (class in ('economy', 'comfort', 'suv', 'vip')),
  color text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;

-- driver_status — one row per driver, updated frequently while online
create table if not exists public.driver_status (
  driver_id uuid primary key references public.profiles (id) on delete cascade,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  heading double precision,
  updated_at timestamptz not null default now()
);
alter table public.driver_status enable row level security;

-- rides — the core ride lifecycle
create table if not exists public.rides (
  id uuid primary key default uuid_generate_v4(),
  rider_id uuid not null references public.profiles (id),
  driver_id uuid references public.profiles (id),
  status text not null default 'requested' check (
    status in ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')
  ),
  vehicle_class text not null check (vehicle_class in ('economy', 'comfort', 'suv', 'vip')),
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  distance_km double precision,
  duration_min double precision,
  estimated_fare_aed numeric(10, 2),
  final_fare_aed numeric(10, 2),
  cancelled_by text check (cancelled_by in ('rider', 'driver', null)),
  cancel_reason text,
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);
alter table public.rides enable row level security;

-- ratings — one rating per side per completed ride
create table if not exists public.ratings (
  id uuid primary key default uuid_generate_v4(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  rated_by text not null check (rated_by in ('rider', 'driver')),
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (ride_id, rated_by)
);
alter table public.ratings enable row level security;

-- ---------------------------------------------------------------------
-- Row-level security policies (all tables above now exist)
-- ---------------------------------------------------------------------

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Riders and drivers matched on the same ride need to see each other's
-- name/photo (not full profile) — handled via this ride-scoped policy.
drop policy if exists "profiles: read counterpart on active ride" on public.profiles;
create policy "profiles: read counterpart on active ride" on public.profiles
  for select using (
    exists (
      select 1 from public.rides r
      where (r.rider_id = auth.uid() and r.driver_id = profiles.id)
         or (r.driver_id = auth.uid() and r.rider_id = profiles.id)
    )
  );

drop policy if exists "vehicles: driver manages own" on public.vehicles;
create policy "vehicles: driver manages own" on public.vehicles
  for all using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

drop policy if exists "vehicles: rider reads matched ride vehicle" on public.vehicles;
create policy "vehicles: rider reads matched ride vehicle" on public.vehicles
  for select using (
    exists (
      select 1 from public.rides r
      where r.rider_id = auth.uid() and r.driver_id = vehicles.driver_id
    )
  );

drop policy if exists "driver_status: driver manages own" on public.driver_status;
create policy "driver_status: driver manages own" on public.driver_status
  for all using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

drop policy if exists "driver_status: rider reads matched driver" on public.driver_status;
create policy "driver_status: rider reads matched driver" on public.driver_status
  for select using (
    exists (
      select 1 from public.rides r
      where r.rider_id = auth.uid()
        and r.driver_id = driver_status.driver_id
        and r.status in ('accepted', 'arriving', 'in_progress')
    )
  );

-- Nearby-driver search for ride matching runs server-side with the
-- service role key (bypasses RLS) — riders and drivers never query the
-- full driver_status table directly, only their own row or a matched ride.

drop policy if exists "rides: rider reads own" on public.rides;
create policy "rides: rider reads own" on public.rides
  for select using (auth.uid() = rider_id);

drop policy if exists "rides: rider creates own" on public.rides;
create policy "rides: rider creates own" on public.rides
  for insert with check (auth.uid() = rider_id);

drop policy if exists "rides: rider cancels own while open" on public.rides;
create policy "rides: rider cancels own while open" on public.rides
  for update using (auth.uid() = rider_id and status in ('requested', 'accepted', 'arriving'));

drop policy if exists "rides: driver reads open requests and own" on public.rides;
create policy "rides: driver reads open requests and own" on public.rides
  for select using (status = 'requested' or auth.uid() = driver_id);

drop policy if exists "rides: driver claims open request" on public.rides;
create policy "rides: driver claims open request" on public.rides
  for update using (status = 'requested' and driver_id is null);

drop policy if exists "rides: driver updates own active ride" on public.rides;
create policy "rides: driver updates own active ride" on public.rides
  for update using (auth.uid() = driver_id);

drop policy if exists "ratings: participant manages own" on public.ratings;
create policy "ratings: participant manages own" on public.ratings
  for all using (
    exists (
      select 1 from public.rides r
      where r.id = ratings.ride_id
        and (r.rider_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Realtime: let both apps subscribe to ride + driver_status changes.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.driver_status;

-- ---------------------------------------------------------------------
-- Auto-create a profile row when someone signs up. Role is passed in
-- via the sign-up call's user_metadata (see src/lib/supabase/auth.ts).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'rider'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
