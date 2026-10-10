-- Migration 002: application logs + monitoring views (T-039)
-- Jalankan setelah schema.sql

create table if not exists public.app_logs (
  id uuid primary key default uuid_generate_v4(),
  level text not null default 'ERROR' check (level in ('DEBUG','INFO','WARN','ERROR','FATAL')),
  scope text not null default 'frontend',
  message text not null,
  details jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  url text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_app_logs_created on public.app_logs(created_at desc);
create index if not exists idx_app_logs_level on public.app_logs(level, created_at desc);

alter table public.app_logs enable row level security;

drop policy if exists p_applogs_insert on public.app_logs;
create policy p_applogs_insert on public.app_logs for insert with check (true);

drop policy if exists p_applogs_select on public.app_logs;
create policy p_applogs_select on public.app_logs for select using (
  public.is_officer() or auth.uid() = user_id
);

-- Monitoring views (officer/admin): antrean + orphan check
create or replace view public.v_ops_queue as
select
  (select count(*) from public.lost_reports where status = 'DILAPORKAN') as lost_pending_validation,
  (select count(*) from public.found_reports where status = 'DILAPORKAN') as found_pending_validation,
  (select count(*) from public.claims where status = 'KLAIM_DIAJUKAN') as claims_pending,
  (select count(*) from public.items where status = 'MENUNGGU_PENGAMBILAN') as pending_pickup,
  (select count(*) from public.items where status = 'DITEMUKAN') as found_ready;

create or replace view public.v_claims_without_verification as
select c.id, c.claim_code, c.created_at
from public.claims c
left join public.verifications v on v.claim_id = c.id
where v.claim_id is null;

create or replace view public.v_items_without_report as
select i.id, i.item_code, i.created_at
from public.items i
left join public.lost_reports lr on lr.item_id = i.id
left join public.found_reports fr on fr.item_id = i.id
where lr.id is null and fr.id is null;
