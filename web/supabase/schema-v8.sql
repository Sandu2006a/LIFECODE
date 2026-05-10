-- ============================================================
-- LIFECODE schema v8 — Workouts table for the You-tab calendar
-- Run AFTER schema-complete.sql + v6 + v7
-- ============================================================

create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  date          date not null,
  type          text not null check (type in ('strength','cardio','mobility','class')),
  name          text,
  start_time    text,                  -- 'HH:MM' 24h
  duration_min  integer not null default 60,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.workouts enable row level security;

do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='workouts' loop
    execute format('drop policy if exists %I on public.workouts', r.policyname);
  end loop;
end $$;

create policy "workouts all"
  on public.workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_workouts_user_date on public.workouts (user_id, date desc);
