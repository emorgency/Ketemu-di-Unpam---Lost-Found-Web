-- Campus Lost and Found — Supabase Schema (T-009, T-010)
-- Jalankan di Supabase SQL Editor. Idempoten (IF NOT EXISTS / DO blocks).

-- Extensions
create extension if not exists "uuid-ossp";

-- ============ ENUMS (via CHECK agar mudah alter) ============
-- Roles: USER, LOST_FOUND_OFFICER, ADMIN
-- Item/report status: DILAPORKAN, DIVERIFIKASI, MENUNGGU_PENCOCOKAN, DITEMUKAN,
--   MENUNGGU_VERIFIKASI_PEMILIK, KLAIM_DIAJUKAN, KLAIM_DIVERIFIKASI,
--   MENUNGGU_PENGAMBILAN, SUDAH_DIAMBIL, SELESAI, DITOLAK
-- Claim status: KLAIM_DIAJUKAN, KLAIM_DIVERIFIKASI, MENUNGGU_PENGAMBILAN, SUDAH_DIAMBIL, SELESAI, DITOLAK

-- ============ TABLES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nim text unique,
  nama text not null,
  email text,
  phone text,
  semester text,
  prodi text,
  staff_no text,
  role text not null default 'USER' check (role in ('USER','LOST_FOUND_OFFICER','ADMIN')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  item_code text unique,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null,
  ciri_khusus text,
  color text,
  brand text,
  model text,
  serial_number text,
  image_url text,
  status text not null default 'DILAPORKAN'
    check (status in ('DILAPORKAN','DIVERIFIKASI','MENUNGGU_PENCOCOKAN','DITEMUKAN','MENUNGGU_VERIFIKASI_PEMILIK','KLAIM_DIAJUKAN','KLAIM_DIVERIFIKASI','MENUNGGU_PENGAMBILAN','SUDAH_DIAMBIL','SELESAI','DITOLAK')),
  storage_location text,
  condition text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lost_reports (
  id uuid primary key default uuid_generate_v4(),
  report_code text unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  lost_location text not null,
  lost_at timestamptz not null,
  description text,
  status text not null default 'DILAPORKAN'
    check (status in ('DILAPORKAN','DIVERIFIKASI','MENUNGGU_PENCOCOKAN','DITEMUKAN','MENUNGGU_VERIFIKASI_PEMILIK','KLAIM_DIAJUKAN','KLAIM_DIVERIFIKASI','MENUNGGU_PENGAMBILAN','SUDAH_DIAMBIL','SELESAI','DITOLAK')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.found_reports (
  id uuid primary key default uuid_generate_v4(),
  report_code text unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  found_location text not null,
  found_at timestamptz not null,
  description text,
  status text not null default 'DILAPORKAN'
    check (status in ('DILAPORKAN','DIVERIFIKASI','MENUNGGU_PENCOCOKAN','DITEMUKAN','MENUNGGU_VERIFIKASI_PEMILIK','KLAIM_DIAJUKAN','KLAIM_DIVERIFIKASI','MENUNGGU_PENGAMBILAN','SUDAH_DIAMBIL','SELESAI','DITOLAK')),
  rejection_reason text,
  received_at timestamptz,
  received_by uuid references public.profiles(id) on delete set null,
  condition text,
  storage_location text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.claims (
  id uuid primary key default uuid_generate_v4(),
  claim_code text unique,
  item_id uuid not null references public.items(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  lost_report_id uuid references public.lost_reports(id) on delete set null,
  hubungan text not null,
  detail_khusus text not null,
  catatan text,
  status text not null default 'KLAIM_DIAJUKAN'
    check (status in ('KLAIM_DIAJUKAN','KLAIM_DIVERIFIKASI','MENUNGGU_PENGAMBILAN','SUDAH_DIAMBIL','SELESAI','DITOLAK')),
  rejection_reason text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.verifications (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  type text not null default 'OWNERSHIP',
  evidence_ref text,
  evidence_meta jsonb,
  result text not null default 'PENDING' check (result in ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  notes text
);

create table if not exists public.pickups (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_nim text,
  picked_up_at timestamptz default now(),
  handled_by uuid references public.profiles(id) on delete set null,
  handover_note text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id, created_at desc);

-- ============ CODE GENERATION (trigger) ============
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

-- Fungsi kode per tabel (satu fungsi satu tabel — tidak ada referensi silang).
-- claims tidak punya updated_at sehingga fungsinya tidak menyentuhnya.
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

drop trigger if exists trg_codes_items on public.items;
drop trigger if exists trg_items_code on public.items;
create trigger trg_items_code before insert or update on public.items for each row execute function public.trg_items_code();
drop trigger if exists trg_codes_lost on public.lost_reports;
drop trigger if exists trg_lost_code on public.lost_reports;
create trigger trg_lost_code before insert or update on public.lost_reports for each row execute function public.trg_lost_code();
drop trigger if exists trg_codes_found on public.found_reports;
drop trigger if exists trg_found_code on public.found_reports;
create trigger trg_found_code before insert or update on public.found_reports for each row execute function public.trg_found_code();
drop trigger if exists trg_codes_claims on public.claims;
drop trigger if exists trg_claim_code on public.claims;
create trigger trg_claim_code before insert on public.claims for each row execute function public.trg_claim_code();
drop function if exists public.assign_codes();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.lost_reports enable row level security;
alter table public.found_reports enable row level security;
alter table public.claims enable row level security;
alter table public.verifications enable row level security;
alter table public.pickups enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Helper RLS: SECURITY DEFINER agar query di dalamnya melewati RLS
-- (mencegah infinite recursion → HTTP 500). Lihat migrasi 007.
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_officer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('LOST_FOUND_OFFICER','ADMIN'))
$$;

-- profiles: user read own + officer/admin read all; user update own non-role
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select using (
  auth.uid() = id or public.is_officer()
);
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (auth.uid() = id or public.current_role() = 'ADMIN');
drop policy if exists p_profiles_insert on public.profiles;
create policy p_profiles_insert on public.profiles for insert with check (auth.uid() = id);

-- categories: public read, admin write
drop policy if exists p_cat_select on public.categories;
create policy p_cat_select on public.categories for select using (true);
drop policy if exists p_cat_write on public.categories;
create policy p_cat_write on public.categories for all using (public.current_role() = 'ADMIN');

-- items: public can read non-sensitive columns via view logic in app; RLS allows select all authenticated, but sensitive fields filtered in app.
-- Strict: anon can select items with status in (DITEMUKAN, MENUNGGU_PENCOCOKAN...) — keep simple: authenticated select all.
drop policy if exists p_items_select on public.items;
create policy p_items_select on public.items for select using (true);
drop policy if exists p_items_insert on public.items;
create policy p_items_insert on public.items for insert with check (auth.uid() = created_by or public.is_officer());
drop policy if exists p_items_update on public.items;
create policy p_items_update on public.items for update using (public.is_officer() or auth.uid() = created_by);

-- lost_reports: owner + officer/admin
drop policy if exists p_lost_select on public.lost_reports;
create policy p_lost_select on public.lost_reports for select using (auth.uid() = user_id or public.is_officer());
drop policy if exists p_lost_insert on public.lost_reports;
create policy p_lost_insert on public.lost_reports for insert with check (auth.uid() = user_id);
drop policy if exists p_lost_update on public.lost_reports;
create policy p_lost_update on public.lost_reports for update using (public.is_officer() or auth.uid() = user_id);

-- found_reports: same
drop policy if exists p_found_select on public.found_reports;
create policy p_found_select on public.found_reports for select using (true);
drop policy if exists p_found_insert on public.found_reports;
create policy p_found_insert on public.found_reports for insert with check (auth.uid() = user_id);
drop policy if exists p_found_update on public.found_reports;
create policy p_found_update on public.found_reports for update using (public.is_officer() or auth.uid() = user_id);

-- claims: claimant + officer
drop policy if exists p_claims_select on public.claims;
create policy p_claims_select on public.claims for select using (auth.uid() = claimant_id or public.is_officer());
drop policy if exists p_claims_insert on public.claims;
create policy p_claims_insert on public.claims for insert with check (auth.uid() = claimant_id);
drop policy if exists p_claims_update on public.claims;
create policy p_claims_update on public.claims for update using (public.is_officer());

-- verifications: officer only write, involved read
drop policy if exists p_ver_select on public.verifications;
create policy p_ver_select on public.verifications for select using (public.is_officer() or exists (select 1 from public.claims c where c.id = claim_id and c.claimant_id = auth.uid()));
drop policy if exists p_ver_write on public.verifications;
create policy p_ver_write on public.verifications for all using (public.is_officer());

-- pickups: officer write, claimant read
drop policy if exists p_pick_select on public.pickups;
create policy p_pick_select on public.pickups for select using (public.is_officer() or exists (select 1 from public.claims c where c.id = claim_id and c.claimant_id = auth.uid()));
drop policy if exists p_pick_insert on public.pickups;
create policy p_pick_insert on public.pickups for insert with check (public.is_officer());

-- notifications: owner only
drop policy if exists p_notif_all on public.notifications;
create policy p_notif_all on public.notifications for all using (auth.uid() = user_id);

-- audit: officer/admin read, authenticated insert (via app)
drop policy if exists p_audit_select on public.audit_logs;
create policy p_audit_select on public.audit_logs for select using (public.is_officer());
drop policy if exists p_audit_insert on public.audit_logs;
create policy p_audit_insert on public.audit_logs for insert with check (auth.uid() = actor_id or public.is_officer());

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values ('item-photos','item-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('evidence','evidence', false) on conflict (id) do nothing;

-- item-photos: public read, authenticated write ≤5MB jpg/png/webp
drop policy if exists sp_item_read on storage.objects;
create policy sp_item_read on storage.objects for select using (bucket_id = 'item-photos');
drop policy if exists sp_item_write on storage.objects;
create policy sp_item_write on storage.objects for insert with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');
drop policy if exists sp_item_update on storage.objects;
create policy sp_item_update on storage.objects for update using (bucket_id = 'item-photos' and auth.role() = 'authenticated');

-- evidence: private, authenticated read (app generates signed URL; strict RLS would need custom check — allow authenticated read, filter in app)
drop policy if exists sp_ev_read on storage.objects;
create policy sp_ev_read on storage.objects for select using (bucket_id = 'evidence' and auth.role() = 'authenticated');
drop policy if exists sp_ev_write on storage.objects;
create policy sp_ev_write on storage.objects for insert with check (bucket_id = 'evidence' and auth.role() = 'authenticated');
