-- ─────────────────────────────────────────────────────────────────
-- CoachConnect — Demo seed data
-- Run AFTER schema.sql.
-- Creates demo auth users + profiles via service role.
-- ─────────────────────────────────────────────────────────────────

-- Demo school account  (email: school@demo.com  password: demo1234)
-- Demo coach accounts  (email: coach1@demo.com  password: demo1234)
--                      (email: coach2@demo.com  password: demo1234)
--
-- Create these users in your Supabase Auth dashboard or via CLI:
--   supabase auth users create --email school@demo.com --password demo1234 --data '{"role":"school","full_name":"Sarah Johnson"}'
--   supabase auth users create --email coach1@demo.com --password demo1234 --data '{"role":"coach","full_name":"Thabo Nkosi"}'
--   supabase auth users create --email coach2@demo.com --password demo1234 --data '{"role":"coach","full_name":"Kyle van Wyk"}'
--
-- Then replace the UUIDs below with the real IDs from your auth.users table
-- and run this file.

-- ── Placeholder UUIDs — replace with real auth.users IDs ────────
-- school_user_id  = '00000000-0000-0000-0000-000000000001'
-- coach1_user_id  = '00000000-0000-0000-0000-000000000002'
-- coach2_user_id  = '00000000-0000-0000-0000-000000000003'

-- School profile
insert into schools (user_id, name, contact_name, location, province, phone)
values (
  '00000000-0000-0000-0000-000000000001',
  'Umhlanga Ridge Primary',
  'Sarah Johnson',
  'Umhlanga',
  'KwaZulu-Natal',
  '031 555 1234'
) on conflict (user_id) do nothing;

-- Coach profiles
insert into coach_profiles (user_id, full_name, bio, location, province, sports, experience_years, hourly_rate, available)
values (
  '00000000-0000-0000-0000-000000000002',
  'Thabo Nkosi',
  'Qualified soccer and athletics coach with 7 years experience coaching primary school learners in KZN. FA Level 2 certified.',
  'Durban North',
  'KwaZulu-Natal',
  array['Soccer', 'Athletics', 'Multi-sport'],
  7,
  250,
  true
), (
  '00000000-0000-0000-0000-000000000003',
  'Kyle van Wyk',
  'Former provincial cricket player turned coach. Specialising in U8–U14 cricket, hockey and netball. Patient and enthusiastic.',
  'Umhlanga',
  'KwaZulu-Natal',
  array['Cricket', 'Hockey', 'Netball'],
  4,
  200,
  true
) on conflict (user_id) do nothing;

-- Sample job posted by the school
-- (replace school_id with the real id from schools table)
insert into jobs (school_id, title, sport, date, time, duration_hours, age_group, pay, notes, status)
select
  s.id,
  'U10 Soccer Skills Coach',
  'Soccer',
  current_date + interval '7 days',
  '14:00',
  1.5,
  'U10',
  300,
  'Looking for an energetic coach for our U10 soccer training session. Must have own transport. 22 learners.',
  'open'
from schools s where s.name = 'Umhlanga Ridge Primary'
on conflict do nothing;

insert into jobs (school_id, title, sport, date, time, duration_hours, age_group, pay, notes, status)
select
  s.id,
  'Cricket Fielding & Batting — Term 1',
  'Cricket',
  current_date + interval '14 days',
  '15:00',
  2.0,
  'U12',
  400,
  'Two-hour cricket session covering fielding basics and batting technique. Equipment provided. 18 learners.',
  'open'
from schools s where s.name = 'Umhlanga Ridge Primary'
on conflict do nothing;
