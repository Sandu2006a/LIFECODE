-- ============================================================
-- LIFECODE schema v2 additions
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Add profile fields for onboarding
alter table public.profiles
  add column if not exists sport             text,
  add column if not exists age              integer,
  add column if not exists gender           text check (gender in ('male','female','other')),
  add column if not exists weight_kg        numeric(5,1),
  add column if not exists height_cm        integer,
  add column if not exists goal             text,
  add column if not exists onboarding_done  boolean default false;

-- AI long-term memory per user
create table if not exists public.user_memories (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  memory      text not null,
  category    text not null default 'general',
  created_at  timestamptz default now()
);

alter table public.user_memories enable row level security;
create policy "own memories" on public.user_memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grant everyone free Protocol access by default (until payment is wired up)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, display_name, avatar_letter)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', 'Athlete'),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email, 'A'), 1))
  )
  on conflict (id) do nothing;

  -- Free protocol access for early users
  insert into public.app_access (user_id, access_level, is_active, reason)
  values (new.id, 'protocol', true, 'early_access')
  on conflict (user_id) do nothing;

  return new;
end; $$;

-- food_logs: fix columns to match what the chat API expects
alter table public.food_logs
  add column if not exists meal     text,
  add column if not exists protein  numeric(6,1),
  add column if not exists carbs    numeric(6,1),
  add column if not exists fats     numeric(6,1),
  add column if not exists calories integer,
  add column if not exists logged_at timestamptz default now();
