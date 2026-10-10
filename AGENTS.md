# AGENTS.md
# Development Guidelines — Campus Lost and Found

## 1. Project Context

Project ini adalah Sistem Informasi Lost and Found untuk membantu penanganan barang hilang dan ditemukan di lingkungan kampus.

Semua implementasi harus tetap berada dalam domain:

> **Pelaporan → Validasi → Pencocokan → Verifikasi Kepemilikan → Pengambilan → Riwayat Penanganan**

Jangan menambahkan fitur di luar domain tanpa perubahan scope yang disetujui.

---

## 2. Core Principles

### 2.1 Domain First

Nama entitas, API, database, dan UI harus menggunakan istilah domain Lost and Found secara konsisten.

Contoh:

- `LostReport`
- `FoundReport`
- `Item`
- `Claim`
- `Verification`
- `Pickup`
- `Notification`
- `AuditLog`

### 2.2 Security First

Data berikut dianggap sensitif:

- NIM.
- KTP.
- Nomor kontak.
- Bukti kepemilikan.
- Foto pribadi yang digunakan sebagai bukti.
- Dokumen kendaraan.
- Bukti transaksi.

Data tersebut tidak boleh masuk response publik.

### 2.3 Role-Based Access

Gunakan minimal:

```text
USER
LOST_FOUND_OFFICER
ADMIN
```

Authorization harus dilakukan di server/backend, bukan hanya menyembunyikan tombol di frontend.

### 2.4 Auditability

Aktivitas berikut wajib memiliki audit trail:

- Validasi.
- Penolakan.
- Perubahan status.
- Verifikasi klaim.
- Penerimaan barang.
- Pengambilan barang.

---

## 3. Coding Rules

### General

- Gunakan TypeScript untuk aplikasi web jika stack JavaScript/TypeScript digunakan.
- Hindari `any` kecuali benar-benar diperlukan.
- Gunakan schema validation pada input.
- Pisahkan business logic dari UI.
- Jangan menaruh logic database langsung di komponen UI.
- Gunakan environment variables untuk secret.
- Jangan commit `.env`.

### Naming

Gunakan:

- `camelCase` untuk variable/function.
- `PascalCase` untuk component/class/type.
- `UPPER_SNAKE_CASE` untuk constant atau enum value jika sesuai style project.
- Nama file harus konsisten dengan framework yang digunakan.

### Error Handling

Setiap operasi penting harus menangani:

- Unauthorized.
- Forbidden.
- Validation error.
- Not found.
- Conflict/state transition error.
- Internal error.

Pesan error untuk user harus informatif tetapi tidak membocorkan data internal.

---

## 4. Status Transition

Status tidak boleh berubah secara bebas.

Contoh valid:

```text
DILAPORKAN
→ DIVERIFIKASI
→ MENUNGGU_PENCOCOKAN
→ DITEMUKAN
→ MENUNGGU_VERIFIKASI_PEMILIK
→ KLAIM_DIAJUKAN
→ KLAIM_DIVERIFIKASI
→ MENUNGGU_PENGAMBILAN
→ SUDAH_DIAMBIL
→ SELESAI
```

Transition yang tidak valid harus ditolak oleh backend.

Contoh:

```text
SUDAH_DIAMBIL → DILAPORKAN
```

tidak diperbolehkan.

---

## 5. Evidence Handling

Bukti kepemilikan:

- Disimpan pada private storage.
- Tidak menggunakan public URL permanen jika tidak diperlukan.
- Akses menggunakan authorization.
- Validasi tipe dan ukuran file.
- Nama file tidak boleh dipercaya sebagai sumber identitas.
- Metadata file dicatat.
- Penghapusan bukti mengikuti kebijakan retensi kampus.

---

## 6. API Rules

API harus mengikuti prinsip:

- Authentication.
- Authorization.
- Input validation.
- Business rule validation.
- Database transaction untuk operasi multi-step.
- Consistent response/error format.
- Pagination untuk daftar data.

Contoh resource:

```text
POST   /lost-reports
GET    /lost-reports
GET    /lost-reports/:id
PATCH  /lost-reports/:id

POST   /found-reports
GET    /found-items
GET    /found-items/:id

POST   /claims
GET    /claims/:id
PATCH  /claims/:id/verify

POST   /items/:id/receive
POST   /items/:id/pickup

GET    /notifications
PATCH  /notifications/:id/read

GET    /audit-logs
```

Endpoint dapat disesuaikan dengan framework yang dipilih.

---

## 7. Database Rules

Relasi inti:

```text
User
 ├── LostReport
 ├── FoundReport
 ├── Claim
 └── Notification

Item
 ├── FoundReport
 ├── Claim
 ├── Verification
 ├── Pickup
 └── AuditLog
```

Gunakan foreign key dan constraint untuk menjaga integritas.

Jangan menyimpan data yang sama secara tidak perlu.

---

## 8. UI Rules

UI harus:

- Menampilkan status secara jelas.
- Memisahkan data publik dan data privat.
- Menyediakan confirmation dialog untuk tindakan irreversible.
- Menampilkan alasan ketika klaim ditolak.
- Menampilkan timeline penanganan.
- Menyediakan loading, empty, error, dan success state.
- Responsif untuk desktop dan mobile.

---

## 9. Testing Rules

Minimal:

### Unit Test

Untuk:

- Status transition.
- Validasi input.
- Business rules.
- Permission checks.

### Integration Test

Untuk:

- Create report.
- Validate report.
- Create claim.
- Verify ownership.
- Record pickup.

### End-to-End Test

Skenario utama:

```text
User reports lost item
→ Officer validates
→ Item is found
→ Claim is submitted
→ Officer verifies ownership
→ Item is picked up
→ Process is completed
```

### Acceptance Test

Gunakan kebutuhan pada PRD sebagai acceptance criteria.

---

## 10. Waterfall Documentation

Perubahan pada fase berikutnya harus tetap dapat ditelusuri ke requirement.

```text
Requirement
→ Design
→ Implementation
→ Test Case
→ Test Result
```

Jangan mengimplementasikan fitur baru hanya karena fitur tersebut mudah dibuat.

---

## 11. Git Rules

Branch convention:

```text
main
develop
feature/*
fix/*
refactor/*
test/*
docs/*
```

Commit convention:

```text
feat: add lost report
fix: prevent invalid claim transition
docs: update lost and found flow
test: add ownership verification tests
refactor: separate claim service
```

Pull request harus menjelaskan:

- Masalah.
- Perubahan.
- Acceptance criteria.
- Testing.
- Dampak database/API jika ada.

---

## 12. Definition of Done

Task dianggap selesai jika:

- Requirement terpenuhi.
- Authorization sudah diterapkan.
- Validation sudah diterapkan.
- Error state tersedia.
- Audit trail tersedia jika relevan.
- Test utama lulus.
- Tidak ada secret di repository.
- Dokumentasi diperbarui jika API/schema berubah.
