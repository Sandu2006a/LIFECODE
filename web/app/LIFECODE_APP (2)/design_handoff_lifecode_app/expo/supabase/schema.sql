-- LIFECODE — initial schema
-- Run in Supabase SQL editor.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text default 'Mark',
  avatar_letter text default 'M',
  created_at timestamptz default now()
);

create table if not exists intake_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  pack text not null check (pack in ('morning', 'recovery')),
  taken_at timestamptz default now()
);

create table if not exists food_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  text text not null,
  pack text,
  logged_at timestamptz default now()
);

create table if not exists conversations (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Row-Level Security
alter table profiles enable row level security;
alter table intake_logs enable row level security;
alter table food_logs enable row level security;
alter table conversations enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own intakes" on intake_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own foods"   on food_logs   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own convos"  on conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();
