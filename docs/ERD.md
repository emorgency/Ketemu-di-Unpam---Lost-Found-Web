# ERD — Campus Lost and Found (T-006)

```text
profiles (id UUID PK FK auth.users, nim TEXT UNIQUE, nama TEXT, email TEXT, phone TEXT, role TEXT CHECK IN (USER, LOST_FOUND_OFFICER, ADMIN), created_at, updated_at)
  ├──< lost_reports (id UUID PK, report_code TEXT UNIQUE e.g. LNF-00125, user_id FK profiles, item_id FK items, lost_location TEXT, lost_at TIMESTAMPTZ, description TEXT, status TEXT, rejection_reason TEXT, created_at, updated_at)
  ├──< found_reports (id UUID PK, report_code TEXT UNIQUE e.g. FND-00125, user_id FK profiles, item_id FK items NULL, found_location TEXT, found_at TIMESTAMPTZ, description TEXT, status TEXT, rejection_reason TEXT, received_at TIMESTAMPTZ, received_by FK profiles, condition TEXT, storage_location TEXT, note TEXT, created_at, updated_at)
  ├──< claims (id UUID PK, claim_code TEXT UNIQUE e.g. CLM-001, item_id FK items, claimant_id FK profiles, lost_report_id FK lost_reports NULL, hubungan TEXT, detail_khusus TEXT, catatan TEXT, status TEXT, rejection_reason TEXT, submitted_at, reviewed_at, reviewed_by FK profiles, created_at)
  └──< notifications (id UUID PK, user_id FK profiles, type TEXT, title TEXT, message TEXT, read_at TIMESTAMPTZ, created_at)
  └──< audit_logs (id UUID PK, actor_id FK profiles, entity_type TEXT, entity_id TEXT, action TEXT, old_value JSONB, new_value JSONB, created_at)

categories (id UUID PK, name TEXT UNIQUE, description TEXT, created_at)
  └──< items (id UUID PK, item_code TEXT UNIQUE e.g. ITM-001, category_id FK categories, name TEXT, description TEXT, ciri_khusus TEXT, color TEXT, brand TEXT, model TEXT, serial_number TEXT, image_url TEXT, status TEXT, storage_location TEXT, condition TEXT, created_by FK profiles, created_at, updated_at)
        ├──< claims (item_id)
        ├──< verifications (id UUID PK, claim_id FK claims UNIQUE, type TEXT, evidence_ref TEXT, evidence_meta JSONB, result TEXT CHECK (APPROVED, REJECTED, PENDING), reviewed_by FK profiles, reviewed_at, notes TEXT)
        ├──< pickups (id UUID PK, item_id FK items, claim_id FK claims UNIQUE, recipient_id FK profiles, recipient_nim TEXT, picked_up_at TIMESTAMPTZ, handled_by FK profiles, handover_note TEXT, created_at)
        └──< audit_logs (entity_type='ITEM', entity_id=item_id)
```

Relasi inti sesuai AGENTS.md §7 dan ARCHITECTURE.md §4-§5.

## Status enums

`items.status`, `lost_reports.status`, `found_reports.status`:
DILAPORKAN, DIVERIFIKASI, MENUNGGU_PENCOCOKAN, DITEMUKAN, MENUNGGU_VERIFIKASI_PEMILIK, KLAIM_DIAJUKAN, KLAIM_DIVERIFIKASI, MENUNGGU_PENGAMBILAN, SUDAH_DIAMBIL, SELESAI, DITOLAK

`claims.status`: KLAIM_DIAJUKAN, KLAIM_DIVERIFIKASI, MENUNGGU_PENGAMBILAN, SUDAH_DIAMBIL, SELESAI, DITOLAK

Constraint: FK + UNIQUE report/item/claim codes + NOT NULL field wajib + CHECK status valid. Transisi invalid ditolak di aplikasi (`lib/statuses.js`) dan trigger `enforce_status_transition()` di Postgres (lihat schema.sql).

## Storage

- Bucket `item-photos` (public read, authenticated write, validasi jpg/png/webp ≤5MB).
- Bucket `evidence` (private, hanya owner + OFFICER/ADMIN via RLS signed URL, validasi tipe ≤10MB, metadata dicatat di `verifications.evidence_meta`).
