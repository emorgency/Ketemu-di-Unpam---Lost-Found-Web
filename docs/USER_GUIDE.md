# Panduan Pengguna & Petugas (T-041)

## Pengguna kampus
1. Daftar di `/register` dengan NIM + nama, lalu login di `/login`.
2. Cari barang di `/search` (filter keyword/kategori/warna/lokasi/status).
3. Lapor kehilangan di `/lapor-hilang` — isi field *, submit, simpan ID `LNF-xxxxx`.
4. Lapor penemuan di `/lapor-temu` — bila memungkinkan serahkan fisik ke meja LF.
5. Pantau di `/laporan-saya` (tab Kehilangan/Penemuan/Klaim) + timeline.
6. Klaim: buka item → `Ajukan Klaim` → isi hubungan + detail khusus + bukti → kirim. Klaim TIDAK otomatis bisa diambil.
7. Jika disetujui, datang ke meja LF dengan NIM/KTP, tunjukkan notifikasi `CLAIM_APPROVED`.
8. Notifikasi di `/notifikasi`.

## Petugas Lost and Found
1. Overview di `/officer` (total, antrean, aktivitas).
2. Validasi: `/officer/lost` (Setujui/Tolak + alasan wajib) dan `/officer/found`.
3. Penerimaan fisik: `/officer/found` → `Terima fisik` → isi lokasi simpan + kondisi.
4. Pencocokan: `/officer/matching` → pilih laporan → nilai skor → `Konfirmasi cocok`.
5. Verifikasi: `/officer/claims` → `Review` → buka bukti via signed URL → Setujui/Tolak (+alasan wajib bila tolak).
6. Pengambilan: `/officer/pickup` → verifikasi NIM penerima → `Konfirmasi pengambilan` → isi berita acara.
7. Audit: `/officer/audit` untuk seluruh jejak.

## Admin
- `/admin/users`: cari user, ubah role USER/LOST_FOUND_OFFICER/ADMIN (diaudit).
- `/admin/categories`: tambah/hapus kategori.

## Prosedur klaim & pengambilan (ringkas)
Klaim → verifikasi bukti + identitas → disetujui → notifikasi siap ambil → verifikasi NIM di meja → serah terima tercatat → SELESAI. Tanpa verifikasi, barang TIDAK boleh diserahkan (BR-02).
