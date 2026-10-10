# Implementation Tasks
# Campus Lost and Found

> **Development Method:** Waterfall  
> **Scope:** Final MVP

---

# Phase 1 — Requirement Analysis

## T-001 — Finalize Requirements
- [x] Review PRD.
- [x] Confirm actors.
- [x] Confirm functional requirements.
- [x] Confirm non-functional requirements.
- [x] Confirm business rules.
- [x] Confirm out-of-scope features.

**Output:** Approved requirements.

## T-002 — Define User Roles
- [x] USER.
- [x] LOST_FOUND_OFFICER.
- [x] ADMIN.
- [x] Define permissions.

**Output:** Role & Permission Matrix.

## T-003 — Define Status Lifecycle
- [x] Define report statuses.
- [x] Define claim statuses.
- [x] Define allowed transitions.
- [x] Define rejected states.

**Output:** State transition specification.

---

# Phase 2 — System Design

## T-004 — Design Use Case
- [x] User reports lost item.
- [x] User reports found item.
- [x] User searches item.
- [x] User submits claim.
- [x] Officer validates report.
- [x] Officer verifies ownership.
- [x] Officer records pickup.
- [x] Admin manages users/configuration.

## T-005 — Design Activity Diagram
- [x] Lost report flow.
- [x] Found report flow.
- [x] Claim flow.
- [x] Verification flow.
- [x] Pickup flow.

## T-006 — Design ERD
- [x] User.
- [x] Item.
- [x] LostReport.
- [x] FoundReport.
- [x] Claim.
- [x] Verification.
- [x] Pickup.
- [Notification].
- [AuditLog].
- [Category].

## T-007 — Design API
- [x] Authentication.
- [x] Lost reports.
- [x] Found reports.
- [Items.
- [x] Claims.
- [x] Verification.
- [x] Pickup.
- [x] Notifications.
- [x] Audit logs.

## T-008 — Design UI/UX
- [x] Home.
- [x] Search.
- [x] Lost report.
- [Found report.
- [x] My reports.
- [x] Item detail.
- [x] Claim.
- [x] Officer dashboard.
- [x] Verification.
- [x] Pickup.
- [x] Timeline.

---

# Phase 3 — Database

## T-009 — Create Database Schema
- [x] Users.
- [x] Roles.
- [x] Categories.
- [x] Items.
- [x] Lost reports.
- [x] Found reports.
- [x] Claims.
- [x] Verifications.
- [x] Pickups.
- [x] Notifications.
- [x] Audit logs.

## T-010 — Add Constraints
- [x] Foreign keys.
- [x] Unique report IDs.
- [x] Valid enum/status values.
- [x] Required fields.
- [x] Referential integrity.

## T-011 — Seed Data
- [x] Categories.
- [x] Development users.
- [x] Development officer.
- [x] Sample reports.
- [x] Sample found items.

---

# Phase 4 — Authentication & Authorization

## T-012 — Authentication
- [x] Login.
- [x] Logout.
- [x] Session handling.
- [x] User identity.

## T-013 — Authorization
- [x] User permission.
- [x] Officer permission.
- [x] Admin permission.
- [x] Server-side permission checks.

## T-014 — Sensitive Data Protection
- [x] Protect NIM.
- [x] Protect KTP.
- [x] Protect evidence.
- [x] Protect phone numbers.
- [x] Protect private reports.

---

# Phase 5 — Lost Report

## T-015 — Lost Report Form
- [x] Build form.
- [x] Validation.
- [x] Image upload.
- [x] Submit endpoint.
- [x] Generate report ID.

## T-016 — Lost Report Detail
- [x] Detail page.
- [x] Status.
- [x] Timeline.
- [x] Edit if allowed.
- [x] Cancel/close if allowed.

---

# Phase 6 — Found Report

## T-017 — Found Report Form
- [x] Build form.
- [x] Validation.
- [x] Image upload.
- [x] Submit endpoint.

## T-018 — Item Reception
- [x] Officer reception screen.
- [x] Record receivedAt.
- [x] Record receivedBy.
- [x] Record item condition.
- [x] Record storage location.

---

# Phase 7 — Search & Matching

## T-019 — Search
- [x] Keyword search.
- [x] Category filter.
- [x] Color filter.
- [x] Location filter.
- [x] Date filter.
- [x] Status filter.
- [x] Pagination.

## T-020 — Matching
- [x] Define matching attributes.
- [x] Query candidate items.
- [x] Show candidate matches.
- [x] Officer confirms match.
- [x] Record match decision.

---

# Phase 8 — Claim & Verification

## T-021 — Claim Submission
- [x] Claim form.
- [x] Evidence upload.
- [x] Validation.
- [x] Claim status.

## T-022 — Ownership Verification
- [x] Officer review screen.
- [x] Evidence preview.
- [x] Identity verification.
- [x] Approve claim.
- [x] Reject claim.
- [x] Rejection reason.

## T-023 — State Transition Enforcement
- [x] Validate transitions.
- [x] Prevent unauthorized transitions.
- [x] Record audit event.

---

# Phase 9 — Pickup

## T-024 — Pickup Preparation
- [x] Show approved claims.
- [x] Show pickup-ready items.
- [x] Show required identity information.

## T-025 — Record Pickup
- [x] Verify recipient.
- [x] Record pickup time.
- [x] Record officer.
- [x] Record handover.
- [x] Update status.

## T-026 — Pickup History
- [x] View pickup record.
- [x] View timeline.
- [x] Search historical pickup.

---

# Phase 10 — Notifications

## T-027 — Notification Service
- [x] Notification model.
- [x] Create notification event.
- [x] Notification list.
- [x] Mark as read.

## T-028 — Notification Events
- [x] Report validated.
- [x] Potential match.
- [x] Item found.
- [x] Claim submitted.
- [x] Claim approved.
- [x] Claim rejected.
- [x] Ready for pickup.
- [x] Pickup reminder.

---

# Phase 11 — Officer Dashboard

## T-029 — Dashboard Overview
- [x] Total lost reports.
- [x] Total found items.
- [x] Pending verification.
- [x] Pending pickup.
- [x] Recent activity.

## T-030 — Operational Queues
- [x] Reports requiring validation.
- [x] Matching queue.
- [x] Claims requiring verification.
- [x] Pickup queue.

## T-031 — Audit Trail
- [x] Activity history.
- [x] Actor.
- [x] Action.
- [x] Timestamp.
- [x] Old/new state.

---

# Phase 12 — Testing

## T-032 — Unit Tests
- [x] Input validation.
- [x] Status transition.
- [x] Claim rules.
- [x] Permission rules.
- [x] Matching rules.

## T-033 — Integration Tests
- [x] Lost report.
- [x] Found report.
- [x] Item reception.
- [x] Claim.
- [x] Verification.
- [x] Pickup.
- [x] Notification.

## T-034 — E2E Test
- [x] Complete lost-to-pickup scenario.
- [x] Invalid claim scenario.
- [x] Unauthorized access scenario.
- [x] Rejected report scenario.

## T-035 — Security Test
- [x] Unauthorized endpoint.
- [x] IDOR prevention.
- [x] Private evidence access.
- [x] Role escalation.
- [x] File upload validation.

## T-036 — User Acceptance Test
- [x] Student scenario.
- [x] Finder scenario.
- [x] Officer scenario.
- [x] Admin scenario.

---

# Phase 13 — Deployment

## T-037 — Production Configuration
- [x] Environment variables.
- [x] Database.
- [x] Storage.
- [x] Authentication.
- [x] Notification provider.

## T-038 — Deployment
- [x] Build.
- [x] Database migration.
- [x] Deploy.
- [x] Smoke test.

## T-039 — Monitoring
- [x] Error logging.
- [x] Application logs.
- [x] Database monitoring.
- [x] Storage monitoring.

---

# Phase 14 — Documentation

## T-040 — Technical Documentation
- [x] Architecture.
- [x] Database schema.
- [x] API documentation.
- [x] Environment setup.
- [x] Deployment procedure.

## T-041 — User Documentation
- [x] User guide.
- [x] Officer guide.
- [x] Claim procedure.
- [x] Pickup procedure.

---

# Iterasi 2 — Perbaikan (dilaporkan pengguna)

- [x] Back button di semua halaman konten (komponen `BackButton`).
- [x] Profil per role: mahasiswa (nama, NIM, semester, prodi), petugas/admin (nama + no. validasi staff) — halaman `/profil`, migrasi `006`.
- [x] Bug kirim laporan `record "new" has no field "report_code"` — trigger kode per tabel, migrasi `005` (+ perbaikan `schema.sql`).
- [x] Konfirmasi pengiriman laporan: form dibersihkan + panel sukses berisi kode laporan (`LNF-xxxxx`/`FND-xxxxx`).
- [x] Validasi profil (`validateProfile`) + unit test.
- [x] Kelas tulisan bersama (`.lbl/.inp/.btn-primary/.btn-ghost/.card/.page-title`) agar form rapi dan sejajar.
- [x] Anti-eskalasi role (migrasi `004`) + `staff_no` tampil di Kelola Pengguna, prodi/semester tampil di verifikasi klaim.
- [x] Error 500 riwayat/audit (rekursi RLS) — helper jadi SECURITY DEFINER, migrasi `007`.

---

# Iterasi 3 — stabilisasi & realtime (bug semua role)

- [x] Akar daftar kosong & aksi gagal: pastikan migrasi `002`→`008` masuk semua (query verifikasi §E2).
- [x] Bug kapitalisasi status: filter Klaim (`KLAIM_DIAJUKAN`…), filter + tombol aksi Laporan Kehilangan (`DILAPORKAN`…), daftar Matching, warna `StatusBadge` — semua pakai kode DB UPPERCASE.
- [x] Barang yang sudah diklaim hilang dari pencarian & beranda (`PUBLIC_ITEM_STATUSES`).
- [x] Realtime: migrasi `008` + hook `useRealtimeRefresh` di 11 halaman (overview, antrean officer, laporan saya, notifikasi, pencarian, beranda) + refresh saat tab aktif kembali.
- [x] Overview tahan gagal sebagian (`dashboardStats` resilient).
- [x] Error query ditampilkan (banner) di Klaim, Pengguna, Riwayat — tidak lagi kosong diam-diam.
- [x] Kolom aksi laporan non-DILAPORKAN bertuliskan "Sudah diproses".
- [x] Kolom Perubahan riwayat diformat "Dilaporkan → Diverifikasi • Alasan: …".

---

# Iterasi 4 — bug per role (laporan 10 Okt 2026)

- [x] Pencocokan `DILAPORKAN → DITEMUKAN` ditolak: `confirmMatch` kini memajukan laporan selangkah demi selangkah lewat state machine yang valid + kandidat mencakup `DILAPORKAN`.
- [x] Validasi/verify/pickup idempoten: klik ganda & data basi tidak error; laporan+item selalu disinkronkan.
- [x] Beranda: bagian "Laporan terbaru saya" (laporan DILAPORKAN milik sendiri langsung terlihat) + realtime penuh.
- [x] Filter pencarian: banner error, rentang tanggal, tombol Hapus Filter, filter lokasi ikut mencocokkan `found_location`.
- [x] Admin dirampingkan: menu + guard hanya Overview, Riwayat Interaksi, Pengguna, Kategori. Rute operasional khusus `LOST_FOUND_OFFICER`.
- [x] Riwayat & dashboard tampilkan NIM pelaku (`nama (role • nim)`).
- [x] Smoke test memblokir regresi kapitalisasi status.

---

# Definition of Done

Project MVP selesai apabila seluruh alur berikut berjalan:

```text
Laporan Kehilangan
        ↓
Validasi
        ↓
Pencarian/Pencocokan
        ↓
Barang Ditemukan
        ↓
Klaim
        ↓
Verifikasi Kepemilikan
        ↓
Klaim Disetujui
        ↓
Pengambilan
        ↓
Riwayat Tersimpan
        ↓
Selesai
```

Dan seluruh kebutuhan utama PRD telah memiliki implementasi serta pengujian.
