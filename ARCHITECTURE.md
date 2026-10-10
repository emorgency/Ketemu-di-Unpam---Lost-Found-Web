# System Architecture
# Campus Lost and Found

## 1. Architectural Goal

Arsitektur sistem dirancang untuk mendukung proses:

```text
Report
→ Validation
→ Matching
→ Ownership Verification
→ Pickup
→ Completion
```

Arsitektur harus sederhana untuk MVP tetapi cukup modular untuk dikembangkan.

---

## 2. Recommended Architecture

Gunakan pendekatan **modular monolith** untuk MVP.

```text
┌──────────────────────────────────────────────┐
│                  Client                      │
│       Web / Mobile Responsive Browser        │
└──────────────────────┬───────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────┐
│                Application                   │
│                                              │
│  Auth / RBAC                                 │
│  Lost Report Module                          │
│  Found Item Module                           │
│  Matching Module                             │
│  Claim & Verification Module                 │
│  Pickup Module                               │
│  Notification Module                         │
│  Audit Module                                │
└─────────────┬─────────────┬──────────────────┘
              │             │
              ▼             ▼
       ┌────────────┐ ┌──────────────┐
       │ Relational │ │ Private File │
       │ Database   │ │ Storage      │
       └────────────┘ └──────────────┘
              │
              ▼
       ┌──────────────┐
       │ Notification │
       │ Provider     │
       └──────────────┘
```

---

## 3. Architectural Components

### 3.1 Presentation Layer

Tanggung jawab:

- Form.
- Table.
- Search/filter.
- Dashboard.
- Status.
- Notification UI.
- Claim UI.

Tidak boleh menjalankan business rule kritis.

### 3.2 Application Layer

Menangani use case:

- Submit lost report.
- Submit found report.
- Validate report.
- Receive item.
- Match item.
- Submit claim.
- Verify ownership.
- Record pickup.
- Send notification.

### 3.3 Domain Layer

Business rules:

- Valid status transition.
- Ownership verification.
- Claim eligibility.
- Pickup eligibility.
- Role permission.

### 3.4 Infrastructure Layer

Menangani:

- Database.
- Object/file storage.
- Authentication provider.
- Notification provider.
- Logging.

---

## 4. Core Domain Model

```text
USER
 ├──< LOST_REPORT
 ├──< FOUND_REPORT
 ├──< CLAIM
 ├──< NOTIFICATION
 └──< AUDIT_LOG

LOST_REPORT
 └── ITEM

FOUND_REPORT
 └── ITEM

ITEM
 ├──< CLAIM
 ├──< VERIFICATION
 ├──< PICKUP
 └──< AUDIT_LOG
```

---

## 5. Suggested Entities

### User

```text
id
name
email
nim
phone
role
createdAt
updatedAt
```

### Item

```text
id
categoryId
name
description
color
brand
model
serialNumber
imageReference
status
createdAt
updatedAt
```

### LostReport

```text
id
userId
itemId
lostLocation
lostAt
description
status
createdAt
updatedAt
```

### FoundReport

```text
id
userId
itemId
foundLocation
foundAt
receivedAt
receivedBy
status
createdAt
updatedAt
```

### Claim

```text
id
itemId
claimantId
status
submittedAt
reviewedAt
reviewedBy
rejectionReason
```

### Verification

```text
id
claimId
type
evidenceReference
result
reviewedBy
reviewedAt
notes
```

### Pickup

```text
id
itemId
claimId
recipientId
pickedUpAt
handledBy
handoverNote
```

### Notification

```text
id
userId
type
title
message
readAt
createdAt
```

### AuditLog

```text
id
actorId
entityType
entityId
action
oldValue
newValue
createdAt
```

---

## 6. Status Model

```text
DILAPORKAN
   ↓
DIVERIFIKASI
   ↓
MENUNGGU_PENCOCOKAN
   ↓
DITEMUKAN
   ↓
MENUNGGU_VERIFIKASI_PEMILIK
   ↓
KLAIM_DIAJUKAN
   ↓
KLAIM_DIVERIFIKASI
   ↓
MENUNGGU_PENGAMBILAN
   ↓
SUDAH_DIAMBIL
   ↓
SELESAI
```

Rejected flow:

```text
DILAPORKAN → DITOLAK
KLAIM_DIAJUKAN → DITOLAK
```

---

## 7. Matching Architecture

Matching MVP tidak perlu menggunakan AI.

Gunakan rule-based matching dengan atribut:

```text
category
name
brand
model
color
description
location
time
```

Contoh konsep:

```text
Candidate Match
├── Category matches
├── Color matches
├── Brand/model matches
├── Location proximity
└── Time proximity
```

Hasil matching hanya menjadi **rekomendasi untuk petugas**.

Petugas tetap menentukan kecocokan akhir.

---

## 8. Security Architecture

### Authentication

Pengguna harus login untuk:

- Membuat laporan.
- Mengajukan klaim.
- Melihat laporan pribadi.

### Authorization

```text
USER
- own reports
- own claims
- public found item information

OFFICER
- all operational reports
- claims
- verification
- pickup

ADMIN
- system administration
```

### File Security

Bukti kepemilikan:

```text
User
 ↓ authorized request
API
 ↓ permission check
Private Storage
 ↓
Evidence
```

Tidak boleh:

```text
Public URL → sensitive evidence
```

---

## 9. Notification Architecture

Event-driven secara internal:

```text
Status Changed
      ↓
Application Event
      ↓
Notification Service
      ↓
Database Notification
      ↓
User Notification UI
```

Optional external channels:

- Email.
- Push notification.

---

## 10. Audit Architecture

Setiap operasi kritis menghasilkan:

```text
Actor
Action
Entity
Old State
New State
Timestamp
```

Contoh:

```text
Officer A
VERIFY_CLAIM
Claim #123
KLAIM_DIAJUKAN → KLAIM_DIVERIFIKASI
2026-09-26 13:20
```

---

## 11. Deployment Architecture

Rekomendasi umum:

```text
Browser
   │
 HTTPS
   ▼
Web Application
   │
   ├── Database
   ├── Object Storage
   └── Notification Provider
```

Gunakan managed services untuk mengurangi operational overhead pada MVP.

---

## 12. Data Flow

### Lost Report

```text
User
 ↓
Lost Report Form
 ↓
API Validation
 ↓
Database
 ↓
Notification
```

### Found Item

```text
Finder
 ↓
Found Report
 ↓
Officer Validation
 ↓
Physical Item Received
 ↓
Storage Record
 ↓
Database
```

### Claim

```text
User
 ↓
Claim
 ↓
Evidence Upload
 ↓
Officer Review
 ↓
Verification Result
 ↓
Notification
```

### Pickup

```text
Approved Claim
 ↓
Officer confirms identity
 ↓
Item handed over
 ↓
Pickup record
 ↓
Status = SELESAI
```

---

## 13. Architecture Constraints

1. Tidak boleh menyerahkan barang tanpa verifikasi.
2. Sensitive evidence harus private.
3. Status transition harus tervalidasi.
4. Semua aktivitas penting harus dapat diaudit.
5. Matching tidak otomatis menyerahkan barang.
6. Fitur harus tetap berada dalam scope Lost and Found.
