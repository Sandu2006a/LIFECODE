-- ============================================================
-- LIFECODE — COMPLETE schema (one-shot, idempotent, non-destructive)
-- Safe to run multiple times. Does NOT touch existing data.
-- ============================================================

-- ── profiles: ensure all columns we use exist; relax legacy NOT NULL ──
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists display_name text default 'Athlete';
alter table public.profiles add column if not exists avatar_letter text default 'A';
alter table public.profiles add column if not exists sport text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists weight_kg numeric(5,1);
alter table public.profiles add column if not exists height_cm integer;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists onboarding_done boolean default false;
alter table public.profiles add column if not exists calories_target integer default 0;
alter table public.profiles add column if not exists protein_target integer default 0;
alter table public.profiles add column if not exists carbs_target integer default 0;
alter table public.profiles add column if not exists fats_target integer default 0;
alter table public.profiles add column if not exists micro_targets jsonb;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Relax legacy NOT NULL on columns we don't use ('name', 'user_id', etc.)
do $$
declare col record;
begin
  for col in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and is_nullable = 'NO'
    and column_name not in ('id')
  loop
    begin
      execute format('alter table public.profiles alter column %I drop not null', col.column_name);
    exception when others then null;
    end;
  end loop;
end $$;

-- ── intake_logs (Morning/Recovery pack taken-events) ────────
create table if not exists public.intake_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  pack        text not null check (pack in ('morning','recovery')),
  taken_at    timestamptz default now()
);

-- ── meal_logs (AI-analyzed food entries with micronutrients) ─
create table if not exists public.meal_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  meal_name   text not null,
  quantity_g  integer not null default 100,
  nutrients   jsonb,
  logged_at   timestamptz default now()
);

-- ── user_memories (long-term AI memory) ──────────────────────
create table if not exists public.user_memories (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  memory      text not null,
  category    text not null default 'general',
  created_at  timestamptz default now()
);

-- ── conversations (chat history) ─────────────────────────────
create table if not exists public.conversations (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

-- ── workout_events (used by /api/chat) ───────────────────────
create table if not exists public.workout_events (
  id            bigserial primary key,
  user_id       uuid not null references auth.users on delete cascade,
  event_date    date not null,
  event_time    text,
  workout_type  text,
  duration_min  integer,
  created_at    timestamptz default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.intake_logs    enable row level security;
alter table public.meal_logs      enable row level security;
alter table public.user_memories  enable row level security;
alter table public.conversations  enable row level security;
alter table public.workout_events enable row level security;

-- Drop old policies on these tables and re-create cleanly
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
    where schemaname = 'public'
    and tablename in ('profiles','intake_logs','meal_logs','user_memories','conversations','workout_events')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "profiles select"  on public.profiles for select using (auth.uid() = id);
create policy "profiles update"  on public.profiles for update using (auth.uid() = id);
create policy "profiles insert"  on public.profiles for insert with check (auth.uid() = id);

create policy "intake all"   on public.intake_logs    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal all"     on public.meal_logs      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memory all"   on public.user_memories  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "convo all"    on public.conversations  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout all"  on public.workout_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Indexes for fast date-range queries
-- ============================================================
create index if not exists idx_intake_logs_user_date on public.intake_logs (user_id, taken_at desc);
create index if not exists idx_meal_logs_user_date   on public.meal_logs (user_id, logged_at desc);
create index if not exists idx_user_memories_user    on public.user_memories (user_id, created_at desc);
create index if not exists idx_conversations_user    on public.conversations (user_id, created_at desc);
create index if not exists idx_workout_events_user   on public.workout_events (user_id, event_date desc);

-- Done. You should see "Success. No rows returned."
