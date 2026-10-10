# Use Cases & Activity Flows (T-004, T-005)

## USE-01 — User reports lost item
Aktor: USER. Pre: login.
1. User buka `Lapor Kehilangan`, isi kategori/nama/deskripsi/ciri/warna/merek/model/lokasi/waktu/foto/serial.
2. Sistem validasi (`validateLostReport`), generate `report_code` (LNF-xxxxx), insert `items` (status DILAPORKAN) + `lost_reports` dalam 1 transaksi.
3. Sistem tulis `audit_logs` + `notifications` (laporan diterima).
4. User terima ID laporan, diarahkan ke `Laporan Saya` + timeline.

## USE-02 — User reports found item
Aktor: USER. Alur sama via `Lapor Penemuan` → `items` + `found_reports` (status DILAPORKAN).
Pesan: "Jika memungkinkan, serahkan barang ke meja Lost and Found."

## USE-03 — User searches item
Aktor: publik/login. Filter keyword/kategori/warna/lokasi/rentang waktu/status + pagination.
Hasil hanya public view (tanpa NIM/phone/bukti). Klik → `ItemDetail` → `Ajukan Klaim`.

## USE-04 — User submits claim
Aktor: USER. Pre: item status DITEMUKAN/MENUNGGU_VERIFIKASI_PEMILIK.
1. Isi hubungan, bukti kepemilikan (foto/struk/SN/dokumen), detail khusus, catatan.
2. Upload ke bucket private `evidence`. Insert `claims` (KLAIM_DIAJUKAN) + update item → KLAIM_DIAJUKAN + audit + notifikasi ke officer & claimant.
3. Info: "Klaim tidak otomatis dapat diambil. Petugas akan verifikasi."

## USE-05 — Officer validates report
Aktor: LOST_FOUND_OFFICER. Queue `Laporan Kehilangan` / `Barang Ditemukan`.
Setujui: DILAPORKAN → DIVERIFIKASI → MENUNGGU_PENCOCOKAN (+ notifikasi).
Tolak: → DITOLAK + alasan wajib + audit + notifikasi.

## USE-06 — Officer receives physical item
Form terima: receivedAt, receivedBy, kondisi, lokasi simpan, catatan.
Update `found_reports` + `items.storage_location` + audit.

## USE-07 — Officer matches
Pilih 1 lost_report → sistem tampilkan kandidat found items terurut skor (`scoreMatch`).
Officer konfirmasi match → item → DITEMUKAN + notifikasi ke pelapor + audit `MATCH_CONFIRMED`.

## USE-08 — Officer verifies ownership
Buka `Klaim #CLM-xxx`, lihat barang + bukti (private, authorized) + identitas termasking.
Setujui: KLAIM_DIAJUKAN → KLAIM_DIVERIFIKASI → item MENUNGGU_PENGAMBILAN + verifications row + notifikasi siap ambil.
Tolak: alasan wajib → DITOLAK + notifikasi.

## USE-09 — Officer records pickup
Pre: claim KLAIM_DIVERIFIKASI / item MENUNGGU_PENGAMBILAN.
Verifikasi identitas penerima (NIM/KTP), catat waktu/petugas/handover note.
Insert `pickups`, update claim+item → SUDAH_DIAMBIL → SELESAI + audit + notifikasi selesai.

## USE-10 — Admin manages
Kelola users (role), kategori, lihat audit. Semua perubahan role diaudit.

## Activity Diagrams (ringkas)

Lost: Form → Validate → DB → Notify → Timeline.
Found: Form → Validate → DB → (opsional) Reception → Notify.
Claim: Form+Evidence → Validate → Claim row → Item KLAIM_DIAJUKAN → Officer review → Approve/Reject(+reason) → Notify.
Pickup: Approved claim → Verify identity → Handover record → SUDAH_DIAMBIL → SELESAI.
