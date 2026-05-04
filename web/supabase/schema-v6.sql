-- ============================================================
-- LIFECODE schema v6 — protocol_analysis cache column
-- Run AFTER schema-complete.sql
-- ============================================================

alter table public.profiles add column if not exists protocol_analysis jsonb;
alter table public.profiles add column if not exists protocol_updated_at timestamptz;
alter table public.profiles add column if not exists training_frequency integer;
alter table public.profiles add column if not exists best_result text;
