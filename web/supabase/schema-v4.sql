-- ============================================================
-- LIFECODE schema v4 — JWT client support & profile INSERT
-- Run in Supabase SQL Editor AFTER schema.sql + v2 + v3
-- ============================================================

-- Allow users to insert their own profile row
-- (needed when using JWT client instead of service role key)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'users: own profile insert'
  ) then
    execute 'create policy "users: own profile insert" on public.profiles for insert with check (auth.uid() = id)';
  end if;
end $$;

-- Ensure sport column exists (added in v2, but run safe)
alter table public.profiles
  add column if not exists sport text;

-- Ensure onboarding_done exists (added in v2)
alter table public.profiles
  add column if not exists onboarding_done boolean default false;
