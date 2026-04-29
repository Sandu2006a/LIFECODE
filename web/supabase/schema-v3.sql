-- ============================================================
-- LIFECODE schema v3 — Mobile app columns & tables
-- Run in Supabase SQL Editor (AFTER schema.sql + schema-v2.sql)
-- ============================================================

-- Add AI-calculated nutrition target columns to profiles
alter table public.profiles
  add column if not exists calories_target  integer default 0,
  add column if not exists protein_target   integer default 0,
  add column if not exists carbs_target     integer default 0,
  add column if not exists fats_target      integer default 0,
  add column if not exists micro_targets    jsonb;

-- meal_logs: AI-analyzed food entries from the Track screen
create table if not exists public.meal_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  meal_name   text not null,
  quantity_g  integer not null default 100,
  nutrients   jsonb,
  logged_at   timestamptz default now()
);

alter table public.meal_logs enable row level security;

create policy "own meal logs"
  on public.meal_logs
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
