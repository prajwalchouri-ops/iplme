create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  starts_at timestamptz not null,
  venue text not null,
  city text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'completed')),
  created_at timestamptz not null default now(),
  constraint matches_distinct_teams check (home_team <> away_team)
);

create index matches_starts_at_idx on public.matches (starts_at);

alter table public.matches enable row level security;

create policy "Matches are readable by everyone"
  on public.matches for select
  to anon, authenticated
  using (true);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  seats integer not null check (seats between 1 and 10),
  booking_status text not null default 'confirmed'
    check (booking_status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_match_id_idx on public.bookings (match_id);

alter table public.bookings enable row level security;

create policy "Users can view their own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.matches to anon, authenticated;
grant select, insert, update on public.bookings to authenticated;

alter publication supabase_realtime add table public.matches;