-- ── Migration 003: Emergency Jobs ──────────────────────────────────
-- Run in Supabase SQL Editor

alter table jobs
  add column if not exists is_emergency boolean default false,
  add column if not exists expires_at   timestamptz;

-- Fast lookup for open emergency jobs
create index if not exists jobs_emergency_open_idx
  on jobs(is_emergency, status, expires_at)
  where is_emergency = true;
