-- Migration 003: auto-create profiles saat user mendaftar (T-012)
-- Pola standar Supabase. Dipasang sekali di SQL Editor.
-- Membuat profil otomatis sehingga signup tidak bergantung pada insert dari client
-- (yang bisa gagal karena RLS / belum ada session saat confirm-email aktif).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nim, nama, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nim', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'email', new.email),
    new.raw_user_meta_data ->> 'phone',
    -- Role SELALU USER di sini. Metadata dari client tidak dipercaya
    -- (mencegah eskalasi ke ADMIN). Promosi via /admin/users oleh ADMIN.
    'USER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
