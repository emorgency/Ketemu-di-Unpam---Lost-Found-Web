-- Migration 008: realtime untuk sinkronisasi (iterasi 3)
-- Menyalakan postgres_changes agar daftar (laporan, klaim, notifikasi, dsb)
-- ter-refresh otomatis di semua role tanpa reload manual.
-- Idempoten: hanya tambah tabel yang belum masuk publikasi.

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then alter publication supabase_realtime add table public.items; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lost_reports'
  ) then alter publication supabase_realtime add table public.lost_reports; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'found_reports'
  ) then alter publication supabase_realtime add table public.found_reports; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'claims'
  ) then alter publication supabase_realtime add table public.claims; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then alter publication supabase_realtime add table public.notifications; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pickups'
  ) then alter publication supabase_realtime add table public.pickups; end if;
end $$;
