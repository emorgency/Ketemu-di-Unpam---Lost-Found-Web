# Test Plan & Results (T-032 s.d. T-036)

## T-032 Unit (lulus 8/8)
Perintah: `node --test tests/unit/domain.test.mjs` dari `project/`.
- Status transition: alur utama valid, invalid (`SUDAH_DIAMBIL → DILAPORKAN`) ditolak, cabang DITOLAK valid.
- Validation: lost report wajib lengkap, claim wajib detail, penolakan wajib alasan.
- Permission: USER tidak bisa `verify_claim`; OFFICER bisa; ADMIN bisa `manage_users`.
- Matching: barang identik skor ≥60 dan lebih tinggi dari barang berbeda.
Hasil: 8 pass, 0 fail (26 Sep 2026).

## T-033 Integration (manual via app + Supabase)
- Create lost report → `items` + `lost_reports` + audit + notifikasi.
- Validate → status MENUNGGU_PENCOCOKAN + notifikasi REPORT_VALIDATED.
- Found report + reception → storage_location + DITEMUKAN.
- Claim → `claims` + `verifications` + item KLAIM_DIAJUKAN + notifikasi officer.
- Verify approve → MENUNGGU_PENGAMBILAN + CLAIM_APPROVED; reject → DITOLAK + alasan.
- Pickup → `pickups` + SELESAI + PICKUP_DONE.
- Notification list + mark read.

## T-034 E2E (skenario utama)
1. User lapor hilang → officer validasi → muncul di matching.
2. Finder lapor temu → officer validasi + terima fisik → DITEMUKAN.
3. Officer confirm match → pelapor terima POTENTIAL_MATCH.
4. User ajukan klaim + bukti → officer approve → READY_FOR_PICKUP.
5. Officer record pickup dengan NIM → SELESAI + timeline penuh.
Skenario negatif: klaim ganda ditolak (CONFLICT), transisi invalid ditolak, unauthorized redirect ke /unauthorized.

## T-035 Security
- RLS: owner-only untuk lost/claims/notifications; officer untuk verifikasi/pickup/audit.
- IDOR: ItemDetail publik tanpa NIM/bukti; bukti via signed URL 5 menit + auth.
- Role escalation: perubahan role hanya ADMIN (RLS + guard route).
- Upload: image ≤5MB jpg/png/webp; evidence ≤10MB + pdf; metadata dicatat, nama asli tidak dipercaya.

## T-036 UAT (PRD §8)
Checklist: lapor hilang/temuan, validasi, terima barang, cari, cocok, klaim, verifikasi, ambil tercatat, notifikasi status, riwayat — semua tersedia di UI sesuai USER_GUIDE.
