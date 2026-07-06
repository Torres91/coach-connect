-- ── Migration 004: Favourite Coaches ───────────────────────────────
-- Run in Supabase SQL Editor

create table if not exists favourite_coaches (
  id         uuid default gen_random_uuid() primary key,
  school_id  uuid references schools(id) on delete cascade not null,
  coach_id   uuid references coach_profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(school_id, coach_id)
);

alter table favourite_coaches enable row level security;

create policy "favourites: school manages own"
  on favourite_coaches
  using  (school_id = (select id from schools where user_id = auth.uid()))
  with check (school_id = (select id from schools where user_id = auth.uid()));
