# Technical Documentation (T-040)

## 1. Stack
- Frontend: React 19 + Vite + Tailwind 3 + react-router-dom 7 + Supabase JS 2.
- Backend-as-a-service: Supabase (Postgres + Auth + Storage + RLS).
- Tests: `node --test` untuk domain logic (`project/tests/unit/domain.test.mjs`).

## 2. Struktur
```text
project/
  docs/ REQUIREMENTS_TRACEABILITY, USE_CASES, ERD, API, TECHNICAL, USER_GUIDE, TEST_PLAN
  supabase/ schema.sql, seed.sql, README
  tests/unit/domain.test.mjs
  frontend/src/
    lib/ supabase.js, api.js, statuses.js, permissions.js, validation.js, matching.js
    components/ Layout, StatusBadge, StatusTimeline, ItemCard, EmptyState, ConfirmDialog, ProtectedRoute, Loading
    context/ AuthProvider (role USER/LOST_FOUND_OFFICER/ADMIN)
    pages/public/ Home, SearchItems, ItemDetail
    pages/user/ LostReportForm, FoundReportForm, MyReports, LostDetail, ClaimForm, ClaimDetail, Notifications
    pages/officer/ OfficerDashboard, OfficerLostReports, OfficerFoundItems, Matching, Claims, VerificationDetail, Pickup, AuditTrail
    pages/admin/ ManageUsers, ManageCategories
```

## 3. Database
Jalankan `supabase/schema.sql` di SQL Editor, lalu `seed.sql` untuk kategori.
RLS: owner + officer/admin; `evidence` bucket privat; `item-photos` publik-read.
Kode unik via trigger: LNF-xxxxx, FND-xxxxx, ITM-xxxxx, CLM-xxx.

## 4. Auth
Email internal `${nim}@campus.ac.id`. Daftar via `/register` (role USER), ADMIN dapat menaikkan ke LOST_FOUND_OFFICER di `/admin/users`. Session via Supabase Auth.

## 5. API
Semua akses di `lib/api.js` — validasi → transisi (`assertItemTransition`) → tulis DB → `writeAudit` → `notify`. Public view via `toPublicItem()` + masking NIM (`maskNim`).

## 6. Environment
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Lihat `frontend/.env.example`. Jangan commit `.env`.

## 7. Deployment
1. `npm install && npm run build` di `frontend/`.
2. Jalankan migrasi `schema.sql` di Supabase prod.
3. Buat bucket `item-photos` (public) dan `evidence` (private) bila belum ada (schema melakukannya via SQL).
4. Set env prod, deploy `dist/` ke hosting statis, smoke test alur Lapor → Validasi → Klaim → Verifikasi → Ambil.
