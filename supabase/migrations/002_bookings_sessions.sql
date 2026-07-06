-- ── Migration 002: proper bookings + sessions model ────────────────
-- Run in Supabase SQL Editor

-- Add available_days to coach profiles
alter table coach_profiles
  add column if not exists available_days text[] default '{}';

-- Add session columns to jobs table (keep 'jobs' name for FK compat with applications)
alter table jobs
  add column if not exists booking_type     text default 'single'
    check (booking_type in ('single', 'recurring', 'term')),
  add column if not exists role             text default 'coach',
  add column if not exists num_required     integer default 1,
  add column if not exists start_date       date,
  add column if not exists end_date         date,
  add column if not exists term_number      smallint check (term_number between 1 and 4),
  add column if not exists term_year        smallint,
  add column if not exists days_of_week     text[] default '{}',
  add column if not exists time_start       text,
  add column if not exists time_end         text,
  add column if not exists req_first_aid        boolean default false,
  add column if not exists req_police_clearance boolean default false,
  add column if not exists req_transport        boolean default false,
  add column if not exists req_coaching_badge   boolean default false,
  add column if not exists req_experience_years integer default 0,
  add column if not exists budget_amount    integer,
  add column if not exists budget_period    text default 'session'
    check (budget_period in ('session', 'hour', 'week', 'month'));

-- Sessions table — one row per generated date
create table if not exists sessions (
  id          uuid default gen_random_uuid() primary key,
  job_id      uuid references jobs(id) on delete cascade not null,
  date        date not null,
  time_start  text,
  time_end    text,
  status      text default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  coach_id    uuid references coach_profiles(id) on delete set null,
  created_at  timestamptz default now()
);

alter table sessions enable row level security;

create policy "sessions: public read"    on sessions for select using (true);
create policy "sessions: school insert"  on sessions for insert
  with check (
    auth.uid() = (select s.user_id from schools s join jobs j on j.school_id = s.id where j.id = job_id)
  );
create policy "sessions: school update"  on sessions for update using (
  auth.uid() = (select s.user_id from schools s join jobs j on j.school_id = s.id where j.id = job_id)
);
