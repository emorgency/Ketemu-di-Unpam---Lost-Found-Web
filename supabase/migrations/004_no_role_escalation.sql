-- Migration 004: cegah eskalasi role oleh non-ADMIN (T-014 hardening)
-- RLS p_profiles_update di schema.sql memperbolehkan user mengubah barisnya
-- sendiri; tanpa trigger ini user bisa menaikkan role-nya sendiri via API
-- langsung. Trigger ini menutup celah tersebut.
-- Konteks dashboard/SQL Editor (auth.uid() null) tetap diizinkan agar
-- setup awal via SQL tetap bisa berjalan.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if new.role = old.role then
    return new;
  end if;
  -- Konteks dashboard / service_role (tanpa JWT): izinkan (setup awal).
  if auth.uid() is null then
    return new;
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role is distinct from 'ADMIN' then
    raise exception 'Perubahan role hanya dapat dilakukan oleh ADMIN';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_no_role_escalation on public.profiles;
create trigger trg_no_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_role_escalation();
