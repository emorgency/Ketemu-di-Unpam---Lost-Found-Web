# Monitoring (T-039)

## 1. Error logging
- `frontend/src/lib/logger.js`: level DEBUG/INFO/WARN/ERROR/FATAL, buffer 20 entri / flush 5 detik, batch insert ke `public.app_logs`, fallback `localStorage['lnf_app_logs_fallback']` bila offline.
- `components/ErrorBoundary.jsx` + handler `window.onerror` / `unhandledrejection` di `main.jsx` mencatat crash render dan promise ke `app_logs` (scope `ErrorBoundary`, `window.onerror`).
- `lib/api.js:err()` mencatat setiap error `INTERNAL` ke logger. Data sensitif (nim/ktp/phone/password/evidence/token) di-redact sebelum dikirim.

Lihat log terbaru (officer/admin):
```sql
select created_at, level, scope, message, user_id
from public.app_logs
order by created_at desc limit 50;
```

Error 24 jam terakhir per scope:
```sql
select scope, count(*) from public.app_logs
where level in ('ERROR','FATAL') and created_at > now() - interval '24 hours'
group by scope order by count desc;
```

## 2. Application logs
- Audit trail operasional tetap di `audit_logs` (ditulis oleh `api.js:writeAudit`), dibaca di `/officer/audit`.
- Log teknis (crash, gagal upload, gagal insert) di `app_logs`. Fallback lokal dapat dibaca via console: `localStorage['lnf_app_logs_fallback']`.

## 3. Database monitoring
View bawaan (`002_app_logs.sql`):
```sql
select * from public.v_ops_queue;                    -- antrean validasi/verifikasi/pickup
select * from public.v_claims_without_verification;  -- klaim tanpa baris verifikasi (anomali)
select * from public.v_items_without_report;         -- item tanpa laporan (anomali)
```
Pertumbuhan tabel:
```sql
select 'lost_reports' t, count(*) c from public.lost_reports
union all select 'found_reports', count(*) from public.found_reports
union all select 'claims', count(*) from public.claims
union all select 'pickups', count(*) from public.pickups
union all select 'notifications', count(*) from public.notifications
union all select 'audit_logs', count(*) from public.audit_logs
union all select 'app_logs', count(*) from public.app_logs;
```

## 4. Storage monitoring
- Bucket: `item-photos` (public read), `evidence` (private). Batas aplikasi: foto ≤5MB (jpg/png/webp), bukti ≤10MB (+pdf).
- Cek via Dashboard Supabase → Storage → ukutan per bucket, atau SQL:
```sql
select bucket_id, count(*), pg_size_pretty(sum((metadata->>'size')::bigint)) as total
from storage.objects
where bucket_id in ('item-photos','evidence')
group by bucket_id;
```
- File tanpa referensi (upload tapi submit gagal): cari object `evidence/claims/*` yang tidak tercantum di `verifications.evidence_ref`, hapus manual berkala sesuai retensi kampus (AGENTS.md §5).
