-- ============================================================
-- LIFECODE schema v5 — Insert policies for JWT client + indexes
-- Run in Supabase SQL Editor AFTER schema.sql + v2 + v3 + v4
-- ============================================================

-- ── meal_logs: ensure RLS insert policy exists for JWT client ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'meal_logs' and policyname = 'own meal logs insert'
  ) then
    execute 'create policy "own meal logs insert" on public.meal_logs for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'meal_logs' and policyname = 'own meal logs select'
  ) then
    execute 'create policy "own meal logs select" on public.meal_logs for select using (auth.uid() = user_id)';
  end if;
end $$;

-- ── intake_logs: ensure granular policies for JWT client ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'intake_logs' and policyname = 'own intakes insert'
  ) then
    execute 'create policy "own intakes insert" on public.intake_logs for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'intake_logs' and policyname = 'own intakes select'
  ) then
    execute 'create policy "own intakes select" on public.intake_logs for select using (auth.uid() = user_id)';
  end if;
end $$;

-- ── user_memories: ensure granular policies for JWT client ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_memories' and policyname = 'own memories insert'
  ) then
    execute 'create policy "own memories insert" on public.user_memories for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_memories' and policyname = 'own memories select'
  ) then
    execute 'create policy "own memories select" on public.user_memories for select using (auth.uid() = user_id)';
  end if;
end $$;

-- ── conversations: select policy ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversations' and policyname = 'own convos insert'
  ) then
    execute 'create policy "own convos insert" on public.conversations for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'conversations' and policyname = 'own convos select'
  ) then
    execute 'create policy "own convos select" on public.conversations for select using (auth.uid() = user_id)';
  end if;
end $$;

-- ── workout_events table (used by /api/chat for schedule context) ──
create table if not exists public.workout_events (
  id            bigserial primary key,
  user_id       uuid not null references auth.users on delete cascade,
  event_date    date not null,
  event_time    text,
  workout_type  text,
  duration_min  integer,
  created_at    timestamptz default now()
);

alter table public.workout_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'workout_events' and policyname = 'own workouts'
  ) then
    execute 'create policy "own workouts" on public.workout_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- ── Indexes for fast date-range queries on hot paths ──
create index if not exists idx_intake_logs_user_date on public.intake_logs (user_id, taken_at desc);
create index if not exists idx_meal_logs_user_date   on public.meal_logs (user_id, logged_at desc);
create index if not exists idx_user_memories_user    on public.user_memories (user_id, created_at desc);
create index if not exists idx_conversations_user    on public.conversations (user_id, created_at desc);
create index if not exists idx_workout_events_user   on public.workout_events (user_id, event_date desc);
