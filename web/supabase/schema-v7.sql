-- ============================================================
-- LIFECODE schema v7 — Essentials pak support
-- Run AFTER schema-complete.sql + schema-v6.sql
-- ============================================================

-- Allow 'essentials' as a third pack type in intake_logs
do $$
declare con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'public.intake_logs'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%pack%';
  if con_name is not null then
    execute format('alter table public.intake_logs drop constraint %I', con_name);
  end if;
end $$;

alter table public.intake_logs
  add constraint intake_logs_pack_check
  check (pack in ('morning','essentials','recovery'));
