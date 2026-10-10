-- Seed awal (T-011): kategori + contoh akun dev
-- Buat user via Supabase Auth terlebih dahulu, lalu update profiles.
-- Contoh: USER nim 202101001, OFFICER nim 9001, ADMIN nim 1.

insert into public.categories (name, description) values
  ('Elektronik','HP, laptop, charger, earphone, dll'),
  ('Dompet & Surat','Dompet, KTP, KTM, STNK, kartu'),
  ('Tas & Koper','Tas ransel, selempang, koper'),
  ('Kunci','Kunci motor, mobil, loker, kos'),
  ('Pakaian & Aksesoris','Jaket, topi, jam, kacamata'),
  ('Dokumen & Buku','Buku, modul, sertifikat, map'),
  ('Lainnya','Barang lain yang relevan kampus')
on conflict (name) do nothing;

-- Contoh update role setelah user daftar (ganti UUID dengan id auth.users):
-- update public.profiles set role='LOST_FOUND_OFFICER', nim='9001', nama='Petugas LF' where id='<uuid-officer>';
-- update public.profiles set role='ADMIN', nim='1', nama='Admin' where id='<uuid-admin>';
-- update public.profiles set role='USER', nim='202101001', nama='Mahasiswa Contoh' where id='<uuid-user>';
