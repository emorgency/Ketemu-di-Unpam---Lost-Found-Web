# API Design (T-007)

Basis: Supabase (Postgres + Auth + Storage). Pola REST via Supabase client + RPC/transaksi di `frontend/src/lib/api.js`. Otorisasi di RLS; validasi di `lib/validation.js`; transisi di `lib/statuses.js`.

## Konvensi
- Auth: Supabase Auth (email `${nim}@campus.ac.id`). Session di `AuthProvider`.
- Response publik tidak mengandung: nim, phone, KTP, evidence_ref, evidence_meta, recipient_nim. Gunakan `toPublicItem()`.
- Pagination: `page` (1-based), `pageSize` default 12, max 50. Return `{ data, total, page, pageSize }`.
- Error format: `{ code: UNAUTHORIZED|FORBIDDEN|VALIDATION|NOT_FOUND|CONFLICT|INTERNAL, message, details? }`.

## Endpoints (logis → implementasi Supabase)

| Logis (AGENTS.md §6) | Implementasi |
|----------------------|--------------|
| POST /lost-reports | `api.createLostReport(payload)` → insert `items` + `lost_reports` + audit + notify |
| GET /lost-reports | `api.listLostReports({status, mine, page})` |
| GET /lost-reports/:id | `api.getLostReport(id)` (owner/officer/admin) |
| PATCH /lost-reports/:id (validate) | `api.validateLostReport(id, {approve, reason})` |
| POST /found-reports | `api.createFoundReport(payload)` |
| GET /found-items | `api.searchFoundItems({keyword, categoryId, color, location, from, to, status, page})` → public view |
| GET /found-items/:id | `api.getPublicItem(id)` / `api.getItemDetail(id)` (officer sees private) |
| POST /claims | `api.createClaim(itemId, payload, file)` → upload evidence + insert claim + update item |
| GET /claims/:id | `api.getClaim(id)` |
| PATCH /claims/:id/verify | `api.verifyClaim(id, {approve, reason, notes})` + insert `verifications` |
| POST /items/:id/receive | `api.receiveItem(foundReportId, {condition, storageLocation, note})` |
| POST /items/:id/pickup | `api.recordPickup(claimId, {recipientNim, handoverNote})` → insert `pickups` + update claim+item |
| GET /notifications | `api.listNotifications()` |
| PATCH /notifications/:id/read | `api.markNotificationRead(id)` |
| GET /audit-logs | `api.listAuditLogs({entityType, entityId})` (officer/admin) |
| Matching | `api.findCandidates(lostReportId)` + `api.confirmMatch(lostReportId, itemId)` |

## Notifikasi events (FR-11)
REPORT_VALIDATED, POTENTIAL_MATCH, ITEM_FOUND, CLAIM_SUBMITTED, CLAIM_APPROVED, CLAIM_REJECTED, READY_FOR_PICKUP, PICKUP_REMINDER, PICKUP_DONE.

## Audit actions
CREATE_REPORT, VALIDATE_REPORT, REJECT_REPORT, RECEIVE_ITEM, MATCH_CONFIRMED, SUBMIT_CLAIM, VERIFY_CLAIM, REJECT_CLAIM, RECORD_PICKUP, UPDATE_STATUS, UPDATE_ROLE, MANAGE_CATEGORY.
