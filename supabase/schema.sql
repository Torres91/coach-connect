-- ─────────────────────────────────────────────────────────────────
-- CoachConnect — full schema
-- Run this once in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────

-- User profiles (extends auth.users)
create table if not exists profiles (
  id        uuid references auth.users(id) on delete cascade primary key,
  role      text not null check (role in ('coach', 'school')),
  created_at timestamptz default now()
);

-- Schools / Heads of Sport
create table if not exists schools (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade unique not null,
  name         text not null,
  location     text,
  province     text,
  logo_url     text,
  contact_name text,
  phone        text,
  created_at   timestamptz default now()
);

-- Coach profiles
create table if not exists coach_profiles (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade unique not null,
  full_name        text not null,
  bio              text,
  location         text,
  province         text,
  sports           text[] default '{}',
  experience_years integer default 0,
  hourly_rate      integer,
  avatar_url       text,
  available        boolean default true,
  created_at       timestamptz default now()
);

-- Job postings
create table if not exists jobs (
  id             uuid default gen_random_uuid() primary key,
  school_id      uuid references schools(id) on delete cascade not null,
  title          text not null,
  sport          text not null,
  date           date,
  time           text,
  duration_hours numeric(3,1),
  age_group      text,
  pay            integer,
  notes          text,
  status         text default 'open' check (status in ('open', 'filled', 'cancelled')),
  created_at     timestamptz default now()
);

-- Applications
create table if not exists applications (
  id         uuid default gen_random_uuid() primary key,
  job_id     uuid references jobs(id) on delete cascade not null,
  coach_id   uuid references coach_profiles(id) on delete cascade not null,
  status     text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  message    text,
  created_at timestamptz default now(),
  unique(job_id, coach_id)
);

-- Messages
create table if not exists messages (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  job_id       uuid references jobs(id) on delete set null,
  content      text not null,
  read         boolean default false,
  created_at   timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────────

alter table profiles       enable row level security;
alter table schools        enable row level security;
alter table coach_profiles enable row level security;
alter table jobs           enable row level security;
alter table applications   enable row level security;
alter table messages       enable row level security;

-- Profiles: users can read all, write own
create policy "profiles: public read"        on profiles for select using (true);
create policy "profiles: own insert"         on profiles for insert with check (auth.uid() = id);
create policy "profiles: own update"         on profiles for update using (auth.uid() = id);

-- Schools: public read, own write
create policy "schools: public read"         on schools for select using (true);
create policy "schools: own insert"          on schools for insert with check (auth.uid() = user_id);
create policy "schools: own update"          on schools for update using (auth.uid() = user_id);

-- Coach profiles: public read, own write
create policy "coach: public read"           on coach_profiles for select using (true);
create policy "coach: own insert"            on coach_profiles for insert with check (auth.uid() = user_id);
create policy "coach: own update"            on coach_profiles for update using (auth.uid() = user_id);

-- Jobs: public read, school-owner write
create policy "jobs: public read"            on jobs for select using (true);
create policy "jobs: school insert"          on jobs for insert with check (
  auth.uid() = (select user_id from schools where id = school_id)
);
create policy "jobs: school update"          on jobs for update using (
  auth.uid() = (select user_id from schools where id = school_id)
);

-- Applications: coaches insert own, relevant parties read
create policy "apps: coach insert"           on applications for insert
  with check (auth.uid() = (select user_id from coach_profiles where id = coach_id));

create policy "apps: read own"               on applications for select using (
  auth.uid() = (select user_id from coach_profiles where id = coach_id)
  or auth.uid() = (select s.user_id from schools s join jobs j on j.school_id = s.id where j.id = job_id)
);

create policy "apps: school update"          on applications for update using (
  auth.uid() = (select s.user_id from schools s join jobs j on j.school_id = s.id where j.id = job_id)
);

-- Messages: sender/recipient only
create policy "messages: own read"           on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "messages: authenticated send" on messages for insert
  with check (auth.uid() = sender_id);
create policy "messages: mark read"          on messages for update
  using (auth.uid() = recipient_id);

-- ── Realtime publication (needed for live messaging) ──────────
-- Run after tables are created; idempotent
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- ── Trigger: auto-create profile on signup ─────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'coach'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
