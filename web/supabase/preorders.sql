-- LIFECODE pre-order waitlist
-- Run this once in the Supabase SQL editor.

create table if not exists public.preorders (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now(),
  source      text default 'home'
);

create index if not exists preorders_created_at_idx
  on public.preorders (created_at desc);

-- RLS: deny direct anon access — writes happen only through service-role
-- API route (/api/preorder), so the counter is tamper-proof.
alter table public.preorders enable row level security;
