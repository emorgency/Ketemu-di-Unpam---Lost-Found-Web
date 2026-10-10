# UI/UX Brief
# Campus Lost and Found

## 1. Design Objective

Membuat antarmuka yang memudahkan pengguna:

1. Melaporkan barang hilang.
2. Melaporkan barang ditemukan.
3. Mencari barang.
4. Mengajukan klaim.
5. Mengetahui status proses.
6. Mengetahui kapan dan di mana barang dapat diambil.

Petugas harus dapat:

1. Memvalidasi laporan.
2. Melihat kandidat kecocokan.
3. Memverifikasi kepemilikan.
4. Mencatat penerimaan.
5. Mencatat pengambilan.
6. Melihat riwayat.

---

## 2. Information Architecture

```text
Home
├── Cari Barang
├── Lapor Kehilangan
├── Lapor Penemuan
├── Laporan Saya
│   ├── Kehilangan
│   ├── Penemuan
│   └── Klaim
├── Notifikasi
└── Profil

Officer Dashboard
├── Overview
├── Laporan Kehilangan
├── Barang Ditemukan
├── Pencocokan
├── Klaim
├── Verifikasi
├── Pengambilan
└── Riwayat
```

---

## 3. Core Screens

### 3.1 Landing/Home

Komponen:

- Header.
- Search bar.
- CTA `Lapor Kehilangan`.
- CTA `Lapor Penemuan`.
- Daftar barang ditemukan terbaru.
- Informasi meja Lost and Found.

Tujuan utama: membawa pengguna ke proses pencarian atau pelaporan dengan cepat.

---

### 3.2 Search Found Items

Filter:

- Kata kunci.
- Kategori.
- Warna.
- Lokasi.
- Tanggal.
- Status.

Card barang:

```text
[Foto]
Dompet
Warna: Hitam
Ditemukan: Gedung A
Tanggal: 25 Sep 2026
Status: Menunggu Pemilik

[Ajukan Klaim]
```

Jangan menampilkan:

- Bukti kepemilikan.
- NIM pemilik.
- Nomor telepon.
- Dokumen sensitif.

---

### 3.3 Lost Report Form

Field:

- Kategori.
- Nama barang.
- Deskripsi.
- Ciri khusus.
- Warna.
- Merek/model.
- Lokasi kehilangan.
- Perkiraan waktu kehilangan.
- Foto.
- Nomor seri jika ada.

UX:

- Field wajib diberi tanda.
- Gunakan stepper jika form terlalu panjang.
- Tampilkan preview foto.
- Tampilkan confirmation sebelum submit.

---

### 3.4 Found Report Form

Field:

- Kategori.
- Nama/deskripsi.
- Ciri barang.
- Warna.
- Merek/model.
- Lokasi ditemukan.
- Waktu ditemukan.
- Foto.
- Catatan.

Tambahkan informasi:

> Jika memungkinkan, serahkan barang ke meja Lost and Found untuk dicatat dan disimpan secara resmi.

---

### 3.5 My Reports

Tampilkan:

```text
LNF-00125
Dompet hitam
Status: Menunggu Verifikasi
26 Sep 2026
```

Gunakan status badge yang konsisten.

---

### 3.6 Item Detail

Struktur:

```text
Foto Barang
Nama/Kategori
Ciri-ciri
Lokasi ditemukan
Tanggal ditemukan
Status

[Ajukan Klaim]
```

Informasi sensitif tetap tersembunyi.

---

### 3.7 Claim Form

Field:

- Hubungan dengan barang.
- Bukti kepemilikan.
- Detail yang hanya diketahui pemilik.
- Catatan tambahan.

Informasikan:

> Pengajuan klaim tidak otomatis membuat barang dapat diambil. Petugas Lost and Found akan melakukan verifikasi kepemilikan.

---

### 3.8 Verification Screen

Untuk petugas:

```text
┌─────────────────────────────────┐
│ Klaim #CLM-001                  │
├─────────────────────────────────┤
│ Barang: Dompet                  │
│ Pelapor: ********               │
│ NIM: ********                   │
│                                 │
│ Bukti Kepemilikan               │
│ [Preview]                       │
│                                 │
│ [Setujui] [Tolak]               │
└─────────────────────────────────┘
```

Jika ditolak:

```text
Alasan penolakan:
[________________________]

[Tolak Klaim]
```

---

### 3.9 Pickup Screen

Petugas melihat:

- ID barang.
- Pemilik.
- Status klaim.
- Bukti identitas yang diperlukan.
- Waktu pengambilan.
- Petugas.

Action:

```text
[Konfirmasi Pengambilan]
```

Setelah konfirmasi:

```text
Status: SUDAH DIAMBIL
```

---

### 3.10 Timeline

Gunakan timeline untuk menunjukkan:

```text
● 26 Sep 10:15
  Laporan dibuat

● 26 Sep 10:30
  Laporan divalidasi

● 26 Sep 12:10
  Barang diterima petugas

● 26 Sep 13:00
  Klaim diajukan

● 26 Sep 13:30
  Klaim diverifikasi

● 26 Sep 14:00
  Barang diambil
```

---

## 4. Visual Design Direction

### Style

- Clean.
- Institutional.
- Functional.
- Minimal.
- High readability.

### Layout

- Desktop: sidebar + content.
- Mobile: bottom navigation atau compact header.
- Form menggunakan card/section.
- Table untuk operational dashboard.

### Color Semantics

Gunakan semantic colors secara konsisten:

- Neutral → informasi umum.
- Blue → informasi/proses.
- Green → berhasil/disetujui/selesai.
- Yellow → menunggu/perlu tindakan.
- Red → ditolak/error.

Jangan menjadikan warna satu-satunya indikator status; selalu sertakan teks.

---

## 5. Component Inventory

### Common

- Header.
- Sidebar.
- Breadcrumb.
- Search.
- Filter.
- Badge.
- Card.
- Dialog.
- Drawer.
- Toast.
- Pagination.
- Empty state.
- Error state.
- Skeleton.

### Lost and Found

- LostReportForm.
- FoundReportForm.
- ItemCard.
- ItemDetail.
- ClaimForm.
- EvidenceUploader.
- StatusTimeline.
- VerificationPanel.
- PickupPanel.
- NotificationList.

---

## 6. UX Rules

1. Jangan menyembunyikan status penting.
2. Jangan meminta data yang tidak diperlukan.
3. Form laporan harus dapat diselesaikan dengan cepat.
4. Bukti kepemilikan hanya diminta ketika proses klaim.
5. Tindakan kritis menggunakan confirmation.
6. Alasan penolakan harus jelas.
7. Setelah submit, user mendapat ID laporan.
8. Semua status memiliki penjelasan singkat.
9. Pengguna selalu dapat melihat perkembangan laporan miliknya.
10. Empty state harus memberikan next action.

---

## 7. Accessibility

- Keyboard navigable.
- Focus state jelas.
- Label form eksplisit.
- Error message terkait langsung dengan field.
- Kontras teks memadai.
- Jangan mengandalkan warna saja.
- Dialog harus menangani focus dengan benar.
- Upload file menyediakan alternatif yang jelas.

---

## 8. Responsive Behavior

### Desktop

```text
Sidebar | Main Content
```

### Tablet

```text
Compact Sidebar
      +
Main Content
```

### Mobile

```text
Header
Main
Bottom Navigation
```

Form dan card harus menggunakan single-column layout pada layar kecil.

---

## 9. Empty States

### Tidak ada barang ditemukan

> Belum ada barang yang sesuai dengan pencarian.

CTA:

`Ubah Filter`

### Tidak ada laporan

> Anda belum memiliki laporan.

CTA:

`Lapor Kehilangan`

### Tidak ada notifikasi

> Tidak ada pemberitahuan baru.

---

## 10. Critical UX Flow

```text
Home
 ↓
Cari Barang
 ↓
Item Detail
 ↓
Ajukan Klaim
 ↓
Upload Bukti
 ↓
Menunggu Verifikasi
 ↓
Klaim Disetujui
 ↓
Datang ke Meja Lost and Found
 ↓
Verifikasi Identitas
 ↓
Pengambilan
 ↓
Selesai
```
