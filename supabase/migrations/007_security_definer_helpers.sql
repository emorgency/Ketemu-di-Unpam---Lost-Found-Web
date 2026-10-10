-- Migration 007: helper RLS jadi SECURITY DEFINER (fix error 500)
-- BUG: public.is_officer() / public.current_role() dipanggil di dalam RLS policy
-- sekaligus query ke tabel profiles yang dijaga policy itu juga.
-- Pada query tertentu (mis. audit_logs ORDER BY created_at LIMIT 100) evaluasi
-- berulang ini menyebabkan "infinite recursion in policy" → HTTP 500.
-- Perbaikan standar: SECURITY DEFINER agar query di dalam fungsi melewati RLS.

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('LOST_FOUND_OFFICER', 'ADMIN')
  )
$$;
