# Deployment Procedure (T-038)

## 1. Build
```bash
cd frontend
npm install
npm run build
```
Output: `frontend/dist/`. Verifikasi: `dist/index.html` ada dan tidak ada error vite.
Check tambahan:
```bash
cd ..
node scripts/smoke-test.mjs
```

## 2. Database migration (Supabase SQL Editor, berurutan)
1. `supabase/schema.sql` — tabel, trigger kode LNF/FND/ITM/CLM, RLS, bucket `item-photos` (public) + `evidence` (private).
2. `supabase/seed.sql` — kategori dasar (idempoten via `on conflict do nothing`).
3. Semua file `supabase/migrations/` berurutan: `002` → `003` → `004` → `005` → `006` → `007` → `008`.
   Verifikasi dengan query satu tembak di `supabase/README.md` §E2.

Urutan wajib 1 → 2 → 3. Semua skrip idempoten (aman dijalankan ulang).

## 3. Deploy
1. Validasi kesiapan:
   ```bash
   node scripts/deploy-check.mjs
   ```
2. Set env production di hosting (Vercel/Netlify/Caddy/Nginx):
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   Gunakan **anon key**, bukan `service_role`.
3. Deploy folder `frontend/dist/` sebagai situs statis. SPA fallback: semua route diarahkan ke `index.html`.
   - Netlify: `[[redirects]] from="/*" to="/index.html" status=200`
   - Vercel: `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`

## 4. Smoke test (manual, ±10 menit)
1. Buka `/register` → daftar USER → login.
2. `/lapor-hilang` → buat laporan → terima kode `LNF-xxxxx` → cek `/laporan-saya`.
3. Sebagai OFFICER: `/officer/lost` → Setujui → status MENUNGGU_PENCOCOKAN.
4. `/lapor-temu` (akun lain) → OFFICER validasi + Terima fisik di `/officer/found`.
5. `/officer/matching` → pilih laporan → Konfirmasi cocok.
6. `/search` → buka item → `/klaim/:id` → kirim klaim + bukti.
7. OFFICER `/officer/claims/:id` → Setujui → notifikasi READY_FOR_PICKUP.
8. `/officer/pickup` → catat NIM penerima → SELESAI.
9. Cek `/officer/audit` (jejak lengkap) dan `/notifikasi` (event lengkap).
10. Skenario negatif: tolak laporan tanpa alasan (harus gagal), klaim ganda (CONFLICT), akses `/admin/users` sebagai USER (redirect `/unauthorized`).
