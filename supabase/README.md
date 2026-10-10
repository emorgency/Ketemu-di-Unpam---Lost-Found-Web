# Supabase Setup — Campus Lost and Found

## A. Koneksi awal (cukup sekali)

1. Buka [supabase.com](https://supabase.com) → New project → catat **Project URL** dan **anon key**
   (Project Settings → API).
2. Isi `frontend/.env` (contoh di `frontend/.env.example`):
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   Pakai **anon key**, bukan `service_role`. Restart `npm run dev` setiap ganti `.env`.
3. Tes koneksi cepat: `node scripts/deploy-check.mjs` dari folder `project/`.

## B. Skema database (SQL Editor → New query, jalankan berurutan)

1. `supabase/schema.sql` — tabel, trigger kode LNF/FND/ITM/CLM, RLS, bucket.
2. `supabase/seed.sql` — kategori dasar.
3. Migrasi berurutan: `002_app_logs` → `003_handle_new_user` → `004_no_role_escalation` → `005_fix_code_triggers` → `006_profile_fields` → `007_security_definer_helpers` → `008_realtime`.
   Wajib semua, idempoten (aman dijalankan ulang). Khusus `005`: memperbaiki
   bug trigger kode bersama yang menyebabkan `record "new" has no field "report_code"`.
   Khusus `007`: memperbaiki error 500 / `stack depth limit exceeded` (rekursi RLS).

## C. Auth (wajib, kalau tidak signup gagal / tidak bisa login)

Authentication → Providers → Email:
- **Confirm email: OFF** (login memakai email sintetis `NIM@campus.ac.id`
  yang tidak bisa menerima email; jika ON, user tidak akan pernah bisa login).
- Pastikan Email provider **enabled**. Password min. 6 karakter.

## D. Jika memakai project lama (bekas UKM / tabel sudah ada)

Skema lama (trigger/policy/kolom versi UKM) adalah penyebab umum
`signup → 500` dan `profiles → 406`. Diagnosa di SQL Editor:

```sql
-- 1. Trigger warisan di auth.users (penyebab signup 500)
select trigger_name from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';

-- 2. Tabel profiles versi apa?
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles';
```

- Jika ada trigger warisan (mis. `handle_new_user` versi lama), hapus dulu:
  ```sql
  drop trigger if exists <nama_trigger> on auth.users;
  ```
  lalu jalankan ulang `schema.sql` + migrasi `002` + `003`.
- Pastikan `profiles` punya kolom: `id, nim, nama, email, phone, role`.

## E. Akun demo (cara disarankan untuk prototype)

Jangan daftar berulang via web — hemat rate limit dan hasilnya terkontrol.
Buat 3 akun demo langsung di dashboard:

1. Authentication → Users → Add user → Create new user:
   - Email `202101001@campus.ac.id`, password `mahasiswa123`, ✅ **Auto Confirm user**
   - Email `9001@campus.ac.id`, password `petugas123`, ✅ Auto Confirm
   - Email `1@campus.ac.id`, password `admin123`, ✅ Auto Confirm
2. Trigger `003` otomatis membuat baris `profiles`. Rapikan nama + role di SQL Editor:
   ```sql
   update public.profiles set nama = 'Mahasiswa Demo', role = 'USER' where nim = '202101001';
   update public.profiles set nama = 'Petugas LF', role = 'LOST_FOUND_OFFICER' where nim = '9001';
   update public.profiles set nama = 'Admin', role = 'ADMIN' where nim = '1';
   select nim, nama, role from public.profiles;
   ```
3. Login di app dengan NIM + password di atas. Alur `/register` tetap dibiarkan
   aktif sebagai fitur (penguji bisa mencobanya sekali, bukan berkali-kali).
4. Lengkapi profil di halaman `/profil`: mahasiswa mengisi semester + prodi,
   petugas/admin mengisi no. validasi staff kampus (`staff_no`).

## E2. Verifikasi penerapan migrasi (wajib setelah menjalankan 002→008)

Satu query ini membuktikan semua migrasi masuk. Hasil yang benar ada di
komentar kanan:

```sql
select 'trigger_codes' as cek, string_agg(trigger_name, ', ') as hasil
from information_schema.triggers where trigger_name like '%code%'
-- benar: trg_items_code, trg_lost_code, trg_found_code, trg_claim_code
-- salah: masih ada assign_codes / trg_codes_* (= 005 belum jalan)
union all
select 'helper_secdef', string_agg(proname || ':' || (p.prosecdef::text), ', ')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('is_officer', 'current_role')
-- benar: is_officer:true, current_role:true (= 007 sudah jalan)
union all
select 'realtime_pub', coalesce(string_agg(tablename, ', '), '(kosong)')
from pg_publication_tables where pubname = 'supabase_realtime'
-- benar: memuat items, lost_reports, found_reports, claims, notifications, pickups (= 008 sudah jalan)
union all
select 'profiles_cols', string_agg(column_name, ', ')
from information_schema.columns where table_schema = 'public' and table_name = 'profiles';
-- benar: memuat semester, prodi, staff_no (= 006 sudah jalan)
```

## F. Arti error umum

| Error | Arti | Aksi |
|---|---|---|
| `profiles → 406 Cannot coerce…` | Baris profil user tidak ada (atau RLS menutupi) | Jalankan migrasi `003`, daftar ulang; app versi baru juga membuat ulang profil otomatis (self-heal) |
| `record "new" has no field "report_code"` (saat kirim laporan) | Trigger kode versi lama (fungsi bersama lintas tabel) | Jalankan migrasi `005_fix_code_triggers.sql`, lalu kirim ulang laporan |
| Query riwayat/audit → 500 | Rekursi RLS di helper `is_officer()` | Jalankan migrasi `007_security_definer_helpers.sql` |
| `stack depth limit exceeded` (daftar kosong + banner merah) | Sama: rekursi RLS, `007` belum masuk | Jalankan `007`, verifikasi §E2 (`helper_secdef` harus `:true`) |
| `signup → 500` | Trigger warisan di `auth.users` error, atau DB belum disiapkan | Lihat bagian D |
| `signup → 422 / weak password` | Password < 6 karakter | Gunakan password lebih panjang |
| `Transisi status tidak valid` saat pencocokan | Laporan belum divalidasi (masih `DILAPORKAN`) | Sudah ditangani di app (iterasi 4): pencocokan memajukan laporan otomatis. Update kode frontend terbaru |
| Filter/antrean kosong padahal data ada | Kode status salah kapital di filter (`'Dilaporkan'` vs `'DILAPORKAN'`) | Update kode frontend terbaru; smoke test kini memblokir regresi ini |
| `JWT expired / invalid` | Jam/session tidak valid | Logout lalu login ulang |
