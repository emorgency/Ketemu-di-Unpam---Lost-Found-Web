-- Migration 006: kolom profil per role (iterasi 2)
-- USER (mahasiswa): semester, prodi
-- LOST_FOUND_OFFICER / ADMIN: staff_no (no. validasi staff kampus, bukan NIDN)
-- staff_no hanya dibaca pemilik + OFFICER/ADMIN (RLS profiles sudah begitu).

alter table public.profiles add column if not exists semester text;
alter table public.profiles add column if not exists prodi text;
alter table public.profiles add column if not exists staff_no text;

-- handle_new_user diperbarui agar metadata baru ikut tersimpan.
-- Role tetap SELALU USER (anti-eskalasi, lihat 004).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nim, nama, email, phone, semester, prodi, staff_no, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nim', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'email', new.email),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'semester',
    new.raw_user_meta_data ->> 'prodi',
    new.raw_user_meta_data ->> 'staff_no',
    'USER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
