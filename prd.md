# Product Requirements Document (PRD)
# Sistem Informasi Lost and Found Kampus

> **Status:** Final  
> **Metode Pengembangan:** Waterfall  
> **Scope:** MVP  
> **Domain:** Penanganan barang hilang dan barang ditemukan di lingkungan kampus

---

## 1. Informasi Produk

### 1.1 Judul

**Perancangan Sistem Informasi Lost and Found untuk Penanganan Barang Hilang di Lingkungan Kampus**

### 1.2 Tujuan

Membangun sistem informasi yang membantu mahasiswa dan pihak kampus dalam melaporkan, memvalidasi, mencocokkan, mengklaim, dan mencatat pengambilan barang hilang atau ditemukan di lingkungan kampus.

### 1.3 Masalah

Proses Lost and Found secara manual berpotensi menyebabkan:

- Informasi barang hilang/temuan tidak terdokumentasi dengan baik.
- Mahasiswa kesulitan mengetahui apakah barangnya sudah ditemukan.
- Petugas kesulitan melakukan pencatatan dan pencarian barang.
- Proses verifikasi kepemilikan belum terstruktur.
- Riwayat penerimaan dan pengambilan barang sulit ditelusuri.
- Barang yang sudah ditemukan dapat terlambat diambil oleh pemilik.

### 1.4 Sasaran

Sistem ditujukan untuk:

1. Mahasiswa/pengguna kampus sebagai pelapor dan pemilik barang.
2. Petugas Lost and Found sebagai pihak yang melakukan validasi dan penanganan.
3. Admin sistem untuk pengelolaan pengguna dan konfigurasi dasar.

---

## 2. Product Scope

### 2.1 In Scope

1. Laporan kehilangan barang.
2. Laporan penemuan barang.
3. Pencarian barang.
4. Pencocokan laporan kehilangan dengan barang ditemukan.
5. Validasi laporan oleh petugas Lost and Found.
6. Pengajuan klaim barang.
7. Verifikasi kepemilikan.
8. Pencatatan penerimaan barang oleh meja Lost and Found.
9. Pencatatan pengambilan barang.
10. Status barang/laporan.
11. Notifikasi barang yang ditemukan dan belum diambil.
12. Riwayat penanganan barang.
13. Bukti kepemilikan dan identitas pelapor.
14. Bukti serah terima/pengambilan.

### 2.2 Out of Scope

Fitur berikut tidak termasuk MVP:

- Marketplace barang.
- Chat antar pengguna.
- Pembayaran.
- Forum komunitas.
- Gamifikasi.
- Integrasi e-learning.
- Absensi.
- Sistem akademik.
- AI recommendation.
- Pelacakan lokasi secara real-time.
- Integrasi pihak eksternal yang tidak berkaitan langsung dengan Lost and Found.

---

## 3. User Roles

### 3.1 Mahasiswa/Pengguna

Dapat:

- Membuat laporan kehilangan.
- Membuat laporan penemuan.
- Melihat laporan miliknya.
- Mencari barang ditemukan.
- Melihat status laporan.
- Mengajukan klaim.
- Mengunggah bukti kepemilikan.
- Menerima notifikasi.
- Melihat riwayat proses laporan.

### 3.2 Petugas Lost and Found

Dapat:

- Melihat laporan.
- Memvalidasi laporan.
- Memvalidasi barang temuan.
- Menerima barang fisik.
- Mencatat lokasi penyimpanan.
- Melakukan pencocokan laporan.
- Memverifikasi kepemilikan.
- Menyetujui/menolak klaim.
- Mencatat pengambilan barang.
- Mengubah status barang.
- Melihat riwayat penanganan.

### 3.3 Admin

Dapat:

- Mengelola akun pengguna.
- Mengelola akun petugas.
- Mengelola kategori barang.
- Mengelola konfigurasi sistem.
- Melihat data dan log sistem.

---

## 4. Functional Requirements

### FR-01 — Laporan Kehilangan

Pengguna dapat membuat laporan barang hilang dengan minimal:

- Kategori barang.
- Nama/deskripsi barang.
- Ciri-ciri barang.
- Warna.
- Merek/model jika ada.
- Lokasi kehilangan.
- Perkiraan tanggal dan waktu kehilangan.
- Foto barang jika tersedia.
- Nomor seri/identitas barang jika tersedia.
- Informasi tambahan.

Sistem menghasilkan ID laporan unik.

### FR-02 — Laporan Penemuan

Pengguna dapat melaporkan barang yang ditemukan dengan:

- Kategori.
- Deskripsi.
- Ciri-ciri.
- Warna.
- Merek/model.
- Lokasi ditemukan.
- Tanggal dan waktu ditemukan.
- Foto barang.
- Informasi tambahan.

Barang yang ditemukan dapat diarahkan kepada petugas Lost and Found.

### FR-03 — Validasi Laporan

Petugas dapat:

- Memeriksa kelengkapan laporan.
- Menyetujui laporan.
- Menolak laporan dengan alasan.
- Meminta perbaikan data jika diperlukan.

### FR-04 — Penerimaan Barang

Petugas dapat mencatat ketika barang fisik diterima di meja Lost and Found, termasuk:

- ID barang.
- Waktu penerimaan.
- Petugas penerima.
- Kondisi barang.
- Lokasi penyimpanan.
- Catatan.

### FR-05 — Pencarian Barang

Pengguna dapat mencari barang berdasarkan:

- Kata kunci.
- Kategori.
- Warna.
- Lokasi.
- Rentang waktu.
- Status.

### FR-06 — Pencocokan

Sistem menyediakan data yang memungkinkan petugas membandingkan:

- Kategori.
- Nama/deskripsi.
- Warna.
- Merek/model.
- Ciri khusus.
- Lokasi.
- Waktu.

Pencocokan akhir tetap dikonfirmasi oleh petugas.

### FR-07 — Klaim Barang

Pengguna dapat mengajukan klaim terhadap barang yang ditemukan dengan menyertakan bukti kepemilikan.

### FR-08 — Verifikasi Kepemilikan

Bukti yang dapat digunakan:

- Foto barang.
- Struk pembelian.
- STNK/dokumen kendaraan yang relevan.
- Nomor seri.
- Bukti lain yang relevan.

Identitas:

- NIM untuk mahasiswa.
- KTP atau identitas lain jika diperlukan oleh kebijakan kampus.

Petugas dapat menyetujui atau menolak klaim dan wajib memberikan alasan penolakan.

### FR-09 — Pengambilan Barang

Petugas mencatat:

- Pemilik/penerima.
- NIM/identitas.
- Waktu pengambilan.
- Petugas.
- Barang yang diambil.
- Status pengambilan.
- Bukti serah terima jika digunakan.

### FR-10 — Status

Status minimum:

```text
DILAPORKAN
DIVERIFIKASI
MENUNGGU_PENCOCOKAN
DITEMUKAN
MENUNGGU_VERIFIKASI_PEMILIK
KLAIM_DIAJUKAN
KLAIM_DIVERIFIKASI
MENUNGGU_PENGAMBILAN
SUDAH_DIAMBIL
SELESAI
DITOLAK
```

### FR-11 — Notifikasi

Notifikasi dikirim ketika:

- Laporan divalidasi.
- Terdapat kemungkinan kecocokan.
- Barang ditemukan.
- Klaim diajukan.
- Klaim disetujui/ditolak.
- Barang siap diambil.
- Barang belum diambil setelah periode tertentu.

### FR-12 — Riwayat

Sistem mencatat perubahan penting:

- Pembuat laporan.
- Perubahan status.
- Petugas yang memproses.
- Waktu setiap aktivitas.
- Verifikasi klaim.
- Penerimaan barang.
- Pengambilan barang.

---

## 5. Non-Functional Requirements

### NFR-01 — Security

- Autentikasi wajib.
- Otorisasi berbasis role.
- Bukti kepemilikan hanya dapat diakses oleh pihak berwenang.
- Data identitas tidak ditampilkan secara publik.
- Aktivitas penting dicatat dalam audit trail.

### NFR-02 — Privacy

Data sensitif seperti NIM, KTP, nomor kontak, dan bukti kepemilikan harus dibatasi aksesnya.

### NFR-03 — Usability

Alur pelaporan harus sederhana dan dapat dipahami pengguna kampus tanpa pelatihan khusus.

### NFR-04 — Reliability

Data laporan dan riwayat tidak boleh hilang akibat perubahan status.

### NFR-05 — Maintainability

Sistem harus memiliki struktur modular sehingga fitur laporan, verifikasi, notifikasi, dan pengambilan dapat dikembangkan secara terpisah.

---

## 6. Business Rules

1. Satu laporan memiliki ID unik.
2. Barang tidak boleh diserahkan sebelum kepemilikan diverifikasi.
3. Petugas Lost and Found merupakan pihak yang mengesahkan proses klaim.
4. Barang yang sudah diambil tidak dapat diklaim ulang melalui proses normal.
5. Penolakan klaim harus memiliki alasan.
6. Perubahan status penting dicatat dalam riwayat.
7. Informasi publik tentang barang tidak boleh menampilkan bukti kepemilikan atau data pribadi sensitif.
8. KTP hanya digunakan jika diperlukan sesuai kebijakan kampus.
9. Barang yang belum diambil dapat menghasilkan pengingat kepada pemilik.
10. Lokasi fisik penyimpanan barang dikelola oleh petugas.

---

## 7. Primary User Flow

```text
Lapor Kehilangan
      ↓
Validasi Laporan
      ↓
Menunggu Pencocokan
      ↓
Barang Ditemukan
      ↓
Pencocokan
      ↓
Pemilik Mengajukan Klaim
      ↓
Verifikasi Kepemilikan
      ↓
Klaim Disetujui
      ↓
Barang Siap Diambil
      ↓
Pengambilan di Meja Lost and Found
      ↓
Selesai
```

---

## 8. Success Criteria

MVP dianggap memenuhi kebutuhan apabila:

- Pengguna dapat melaporkan kehilangan.
- Pengguna dapat melaporkan penemuan.
- Petugas dapat memvalidasi laporan.
- Petugas dapat mencatat barang yang diterima.
- Pengguna dapat mencari barang.
- Petugas dapat melakukan pencocokan.
- Pengguna dapat mengajukan klaim.
- Petugas dapat memverifikasi kepemilikan.
- Pengambilan barang tercatat.
- Sistem mengirim pemberitahuan terkait status.
- Seluruh proses utama memiliki riwayat.

---

## 9. Development Method

Metode pengembangan menggunakan **Waterfall**:

1. Requirement Analysis.
2. System Design.
3. Implementation.
4. Testing.
5. Deployment.
6. Maintenance.

Setiap fase menghasilkan artefak yang menjadi dasar fase berikutnya.
