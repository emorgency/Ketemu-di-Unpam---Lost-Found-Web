-- Migration 005: perbaiki trigger kode laporan (T-015/T-017 bugfix)
-- BUG: fungsi bersama assign_codes() mereferensikan kolom lintas tabel
-- (report_code/item_code/claim_code/updated_at) sehingga INSERT ke items
-- gagal dengan "record new has no field report_code", dan INSERT ke claims
-- akan gagal karena claims tidak punya kolom updated_at.
-- Perbaikan: satu fungsi kecil per tabel, tanpa referensi silang.

-- 1. Lepas trigger & fungsi lama
drop trigger if exists trg_codes_items on public.items;
drop trigger if exists trg_codes_lost on public.lost_reports;
drop trigger if exists trg_codes_found on public.found_reports;
drop trigger if exists trg_codes_claims on public.claims;
drop function if exists public.assign_codes();

-- 2. Pastikan sequence & helper ada (mandiri bila schema.sql belum penuh jalan)
create or replace function public.gen_code(prefix text, seq_name text)
returns text language plpgsql as $$
declare n int;
begin
  execute format('select nextval(%L)', seq_name) into n;
  return prefix || '-' || lpad(n::text, 5, '0');
end $$;

do $$ begin
  create sequence if not exists seq_lnf start 1;
  create sequence if not exists seq_fnd start 1;
  create sequence if not exists seq_itm start 1;
  create sequence if not exists seq_clm start 1;
exception when duplicate_table then null; end $$;

-- 3. Pastikan kolom kode ada (DB lama / tabel warisan)
alter table public.items add column if not exists item_code text;
alter table public.lost_reports add column if not exists report_code text;
alter table public.found_reports add column if not exists report_code text;
alter table public.claims add column if not exists claim_code text;
alter table public.items add column if not exists updated_at timestamptz default now();
alter table public.lost_reports add column if not exists updated_at timestamptz default now();
alter table public.found_reports add column if not exists updated_at timestamptz default now();

-- 4. Backfill kode yang kosong
update public.items set item_code = public.gen_code('ITM', 'seq_itm') where item_code is null;
update public.lost_reports set report_code = public.gen_code('LNF', 'seq_lnf') where report_code is null;
update public.found_reports set report_code = public.gen_code('FND', 'seq_fnd') where report_code is null;
update public.claims set claim_code = public.gen_code('CLM', 'seq_clm') where claim_code is null;

-- 5. Unique constraint bila belum ada
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'uq_items_item_code') then
    alter table public.items add constraint uq_items_item_code unique (item_code);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'uq_lost_report_code') then
    alter table public.lost_reports add constraint uq_lost_report_code unique (report_code);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'uq_found_report_code') then
    alter table public.found_reports add constraint uq_found_report_code unique (report_code);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'uq_claims_claim_code') then
    alter table public.claims add constraint uq_claims_claim_code unique (claim_code);
  end if;
end $$;

-- 6. Fungsi per tabel (tanpa referensi silang)
create or replace function public.trg_items_code()
returns trigger language plpgsql as $$
begin
  if NEW.item_code is null then
    NEW.item_code := public.gen_code('ITM', 'seq_itm');
  end if;
  NEW.updated_at := now();
  return NEW;
end $$;

create or replace function public.trg_lost_code()
returns trigger language plpgsql as $$
begin
  if NEW.report_code is null then
    NEW.report_code := public.gen_code('LNF', 'seq_lnf');
  end if;
  NEW.updated_at := now();
  return NEW;
end $$;

create or replace function public.trg_found_code()
returns trigger language plpgsql as $$
begin
  if NEW.report_code is null then
    NEW.report_code := public.gen_code('FND', 'seq_fnd');
  end if;
  NEW.updated_at := now();
  return NEW;
end $$;

create or replace function public.trg_claim_code()
returns trigger language plpgsql as $$
begin
  if NEW.claim_code is null then
    NEW.claim_code := public.gen_code('CLM', 'seq_clm');
  end if;
  return NEW;
end $$;

create trigger trg_items_code before insert or update on public.items
  for each row execute function public.trg_items_code();
create trigger trg_lost_code before insert or update on public.lost_reports
  for each row execute function public.trg_lost_code();
create trigger trg_found_code before insert or update on public.found_reports
  for each row execute function public.trg_found_code();
create trigger trg_claim_code before insert on public.claims
  for each row execute function public.trg_claim_code();
