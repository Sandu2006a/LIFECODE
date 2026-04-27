-- ============================================================
-- LIFECODE — Full schema
-- Run in Supabase SQL editor (Settings → SQL Editor)
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique,
  full_name       text,
  display_name    text default 'Athlete',
  avatar_letter   text default 'A',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── subscriptions ────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  plan                     text not null check (plan in ('essentials','protocol','elite_lab')),
  status                   text not null default 'incomplete'
                             check (status in ('active','trialing','past_due','canceled','incomplete','unpaid')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean default false,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- ── orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.profiles(id) on delete set null,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  product_type                text check (product_type in ('essentials_box','protocol_subscription','elite_lab')),
  amount_total                integer,
  currency                    text default 'usd',
  status                      text default 'pending',
  shipping_status             text default 'not_shipped',
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ── app_access ───────────────────────────────────────────────
create table if not exists public.app_access (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  access_level  text not null default 'locked'
                  check (access_level in ('locked','basic','protocol','elite_lab')),
  is_active     boolean default false,
  reason        text,
  updated_at    timestamptz default now()
);

-- ── intake_logs ──────────────────────────────────────────────
create table if not exists public.intake_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  pack        text not null check (pack in ('morning','recovery')),
  taken_at    timestamptz default now()
);

-- ── food_logs ────────────────────────────────────────────────
create table if not exists public.food_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  text        text not null,
  pack        text,
  calories    integer,
  micros      jsonb,
  logged_at   timestamptz default now()
);

-- ── conversations ────────────────────────────────────────────
create table if not exists public.conversations (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

-- ── activation_codes ─────────────────────────────────────────
create table if not exists public.activation_codes (
  code          text primary key,
  user_id       uuid references public.profiles(id),
  product_type  text,
  used          boolean default false,
  used_at       timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.orders         enable row level security;
alter table public.app_access     enable row level security;
alter table public.intake_logs    enable row level security;
alter table public.food_logs      enable row level security;
alter table public.conversations  enable row level security;
alter table public.activation_codes enable row level security;

-- profiles
create policy "users: own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "users: own profile update" on public.profiles for update using (auth.uid() = id);

-- subscriptions
create policy "users: own subscription"   on public.subscriptions for select using (auth.uid() = user_id);

-- orders
create policy "users: own orders"         on public.orders for select using (auth.uid() = user_id);

-- app_access
create policy "users: own access"         on public.app_access for select using (auth.uid() = user_id);

-- intake_logs
create policy "own intakes" on public.intake_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- food_logs
create policy "own foods"   on public.food_logs   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- conversations
create policy "own convos"  on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- activation_codes (user can see their own used code)
create policy "own codes"   on public.activation_codes for select using (auth.uid() = user_id);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-create profile on Supabase Auth signup
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

  -- Default locked access
  insert into public.app_access (user_id, access_level, is_active, reason)
  values (new.id, 'locked', false, 'no_subscription')
  on conflict (user_id) do nothing;

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at       before update on public.profiles       for each row execute procedure public.set_updated_at();
create trigger subscriptions_updated_at  before update on public.subscriptions  for each row execute procedure public.set_updated_at();
create trigger orders_updated_at         before update on public.orders         for each row execute procedure public.set_updated_at();
create trigger app_access_updated_at     before update on public.app_access     for each row execute procedure public.set_updated_at();
