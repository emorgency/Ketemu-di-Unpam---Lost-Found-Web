# Requirement Traceability — Campus Lost and Found (T-001, T-002, T-003)

> Metode: Waterfall. Setiap implementasi harus dapat ditelusuri ke requirement PRD.

## 1. Actors & Roles (T-002)

| Role | Nilai DB (`profiles.role`) | Kemampuan |
|------|----------------------------|-----------|
| USER (mahasiswa/pengguna kampus) | `USER` | Buat laporan hilang/temuan, lihat laporan miliknya, cari barang, ajukan klaim, upload bukti, terima notifikasi, lihat timeline |
| LOST_FOUND_OFFICER (petugas) | `LOST_FOUND_OFFICER` | Semua USER + validasi laporan, terima barang fisik, catat lokasi simpan, pencocokan, verifikasi kepemilikan, setujui/tolak klaim, catat pengambilan, ubah status |
| ADMIN | `ADMIN` | Kelola akun pengguna/petugas, kategori, konfigurasi, lihat audit log |

Permission matrix diimplementasikan di `frontend/src/lib/permissions.js` dan ditegakkan di Supabase RLS (`project/supabase/schema.sql`). Frontend hanya menyembunyikan menu; otorisasi final di server/RLS.

## 2. Functional Requirements → Design → Implementation → Test

| PRD | Design | Implementation | Test |
|-----|--------|----------------|------|
| FR-01 Laporan Kehilangan | USE-01, ERD `lost_reports` + `items`, API `POST /lost-reports` | `pages/user/LostReportForm.jsx`, `lib/api.js:createLostReport`, `lib/validation.js:validateLostReport` | `tests/unit/validation.test.js`, integrasi create report |
| FR-02 Laporan Penemuan | USE-02, ERD `found_reports` | `pages/user/FoundReportForm.jsx`, `api.js:createFoundReport` | integrasi found report |
| FR-03 Validasi Laporan | Activity validasi, API `PATCH /lost-reports/:id`, `PATCH /found-reports/:id` | `pages/officer/OfficerLostReports.jsx`, `OfficerFoundItems.jsx` | E2E validate |
| FR-04 Penerimaan Barang | ERD `found_reports.received_*`, `items.storage_location` | `OfficerFoundItems.jsx` (form terima), `api.js:receiveItem` | integrasi reception |
| FR-05 Pencarian | USE-03, API `GET /found-items?search&category&color&location&date&status` | `pages/public/SearchItems.jsx`, `Home.jsx`, `api.js:searchFoundItems` | unit filter |
| FR-06 Pencocokan | Matching rule-based (category,name,brand,model,color,desc,location,time) | `pages/officer/Matching.jsx`, `lib/matching.js:scoreMatch` | `tests/unit/matching.test.js` |
| FR-07 Klaim | USE-04, ERD `claims`, API `POST /claims` | `pages/user/ClaimForm.jsx` | integrasi claim |
| FR-08 Verifikasi Kepemilikan | USE-05, ERD `verifications`, API `PATCH /claims/:id/verify` | `pages/officer/VerificationDetail.jsx`, `Claims.jsx` | unit + E2E verify |
| FR-09 Pengambilan | ERD `pickups`, API `POST /items/:id/pickup` | `pages/officer/Pickup.jsx` | integrasi pickup |
| FR-10 Status | State machine `lib/statuses.js` | `components/StatusBadge.jsx`, `StatusTimeline.jsx`, guard `canTransition` | `tests/unit/statuses.test.js` |
| FR-11 Notifikasi | ERD `notifications`, event-driven | `lib/api.js:notify`, `pages/user/Notifications.jsx` | integrasi notification |
| FR-12 Riwayat | ERD `audit_logs`, timeline | `lib/api.js:writeAudit`, `pages/officer/AuditTrail.jsx`, `StatusTimeline.jsx` | E2E timeline |
| NFR-01 Security | RLS + private bucket `evidence` | `supabase/schema.sql` RLS, `lib/permissions.js` | `tests/unit/permissions.test.js`, security test |
| NFR-02 Privacy | Public view menyembunyikan NIM/phone/bukti | `api.js:toPublicItem`, `ItemCard.jsx`, `ItemDetail.jsx` | security test IDOR |
| Business Rules BR-01..BR-10 | Domain layer `lib/` | ditegakkan di `api.js` + RLS + UI confirm | acceptance test |

## 3. Status Lifecycle (T-003)

Item lifecycle (sumber kebenaran `items.status`):

```text
DILAPORKAN → DIVERIFIKASI → MENUNGGU_PENCOCOKAN → DITEMUKAN
→ MENUNGGU_VERIFIKASI_PEMILIK → KLAIM_DIAJUKAN → KLAIM_DIVERIFIKASI
→ MENUNGGU_PENGAMBILAN → SUDAH_DIAMBIL → SELESAI
Cabang: DILAPORKAN → DITOLAK, KLAIM_DIAJUKAN → DITOLAK
```

Claim lifecycle (`claims.status`):

```text
KLAIM_DIAJUKAN → KLAIM_DIVERIFIKASI → MENUNGGU_PENGAMBILAN → SUDAH_DIAMBIL → SELESAI
KLAIM_DIAJUKAN → DITOLAK
```

Allowed map ada di `frontend/src/lib/statuses.js:ALLOWED_ITEM_TRANSITIONS` dan `ALLOWED_CLAIM_TRANSITIONS`.
Transisi invalid ditolak (`throw StatusTransitionError`). Contoh larangan: `SUDAH_DIAMBIL → DILAPORKAN`.

## 4. Out of Scope (ditegakkan)

Marketplace, chat antar pengguna, pembayaran, forum, gamifikasi, e-learning, absensi, SIAKAD, AI recommendation, real-time tracking, integrasi eksternal non-LostFound — TIDAK diimplementasikan.

## 5. Acceptance Criteria (PRD §8 → UAT)

MVP lolos jika alur `Lapor → Validasi → Cocok → Temu → Klaim → Verifikasi → Ambil → Riwayat → Selesai` berjalan end-to-end dengan audit + notifikasi, tanpa menampilkan data sensitif ke publik.
