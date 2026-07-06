-- ── Migration 001: job session types & per-session pricing ─────────
-- Run in Supabase SQL Editor

alter table jobs
  add column if not exists schedule_type    text    default 'custom'
    check (schedule_type in ('term', 'month', 'custom')),
  add column if not exists term_number      smallint
    check (term_number between 1 and 4),
  add column if not exists term_year        smallint,
  add column if not exists num_practices    integer  default 0,
  add column if not exists num_matches      integer  default 0,
  add column if not exists pay_per_practice integer,
  add column if not exists pay_per_match    integer;
