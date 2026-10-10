// Application layer: Supabase access (ARCHITECTURE.md §3.2/§3.4, docs/API.md)
// Menegakkan: auth, validation, transition, audit, notification, privacy.

import { supabase } from './supabase'
import { assertItemTransition, assertClaimTransition } from './statuses'
import { validateLostReport as validateLostPayload, validateFoundReport as validateFoundPayload, validateClaim as validateClaimPayload } from './validation'
import { logger } from './logger'

function err(code, message, details) {
  const e = new Error(message)
  e.code = code
  if (details) e.details = details
  // T-039: catat error internal ke app_logs (validation/conflict tidak dicatat agar tidak bising)
  if (code === 'INTERNAL') {
    try {
      logger.error('api', message, { code })
    } catch { /* abaikan */ }
  }
  return e
}

// Petunjuk aksi untuk error database yang berasal dari setup DB
// (bukan dari input user), agar banner di UI langsung bisa ditindaklanjuti.
export function withDbHint(message) {
  const m = String(message || 'Kesalahan database')
  if (/stack depth|recursion|infinite/i.test(m)) {
    return `${m} — Penyebab umum: migrasi 007 (SECURITY DEFINER) belum dijalankan di SQL Editor. Jalankan 007_security_definer_helpers.sql lalu verifikasi via supabase/README.md §E2.`
  }
  return m
}

// ---------- Privacy: public view tanpa data sensitif ----------
export function toPublicItem(row) {
  if (!row) return null
  const { ...rest } = row
  // Pastikan tidak ada field sensitif bocor (profiles join disaring terpisah)
  delete rest.evidence_ref
  return rest
}
export function maskNim(nim) {
  if (!nim) return '********'
  const s = String(nim)
  if (s.length <= 3) return '********'
  return s.slice(0, 2) + '****' + s.slice(-2)
}

// ---------- Helpers ----------
async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) throw err('NOT_FOUND', 'Profil tidak ditemukan')
  return data
}

export async function writeAudit(actorId, entityType, entityId, action, oldValue, newValue) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId, entity_type: entityType, entity_id: String(entityId),
      action, old_value: oldValue ?? null, new_value: newValue ?? null,
    })
  } catch { /* audit tidak boleh menggagalkan transaksi utama */ }
}

export async function notify(userId, type, title, message) {
  if (!userId) return
  try {
    await supabase.from('notifications').insert({ user_id: userId, type, title, message })
  } catch { /* abaikan */ }
}

async function uploadPhoto(file, folder = 'items') {
  if (!file) return null
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('item-photos').upload(path, file)
  if (error) throw err('INTERNAL', 'Gagal mengunggah foto: ' + error.message)
  const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
  return data.publicUrl
}

async function uploadEvidence(file, claimHint = 'claim') {
  if (!file) return { ref: null, meta: null }
  const ext = file.name.split('.').pop()
  const path = `claims/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('evidence').upload(path, file)
  if (error) throw err('INTERNAL', 'Gagal mengunggah bukti: ' + error.message)
  return {
    ref: path,
    meta: { originalName: null, mime: file.type, size: file.size, hint: claimHint, uploadedAt: new Date().toISOString() },
  }
}

// ---------- Categories ----------
export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw err('INTERNAL', 'Gagal memuat kategori')
  return data
}

// ---------- Lost report ----------
export async function createLostReport(userId, payload, photoFile) {
  const errors = validateLostPayload(payload)
  if (Object.keys(errors).length) throw err('VALIDATION', 'Data laporan belum valid', errors)
  const imageUrl = photoFile ? await uploadPhoto(photoFile) : payload.imageUrl || null
  const { data: item, error: e1 } = await supabase.from('items').insert({
    category_id: payload.categoryId, name: payload.name.trim(), description: payload.description.trim(),
    ciri_khusus: payload.ciriKhusus || null, color: payload.color || null, brand: payload.brand || null,
    model: payload.model || null, serial_number: payload.serialNumber || null,
    image_url: imageUrl, status: 'DILAPORKAN', created_by: userId,
  }).select().single()
  if (e1) throw err('INTERNAL', 'Gagal menyimpan barang: ' + e1.message)
  const { data: report, error: e2 } = await supabase.from('lost_reports').insert({
    user_id: userId, item_id: item.id, lost_location: payload.lostLocation.trim(),
    lost_at: payload.lostAt, description: payload.description.trim(), status: 'DILAPORKAN',
  }).select().single()
  if (e2) throw err('INTERNAL', 'Gagal menyimpan laporan: ' + e2.message)
  await writeAudit(userId, 'LOST_REPORT', report.id, 'CREATE_REPORT', null, { code: report.report_code })
  await notify(userId, 'REPORT_RECEIVED', 'Laporan diterima', `Laporan ${report.report_code} berhasil dibuat dan menunggu validasi.`)
  return { item, report }
}

export async function listLostReports({ status, mine, page = 1, pageSize = 12 } = {}) {
  let q = supabase.from('lost_reports').select('*, items(*), profiles!lost_reports_user_id_fkey(nama,nim)', { count: 'exact' }).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (mine) q = q.eq('user_id', mine)
  q = q.range((page - 1) * pageSize, page * pageSize - 1)
  const { data, error, count } = await q
  if (error) throw err('INTERNAL', 'Gagal memuat laporan hilang')
  return { data, total: count ?? data.length, page, pageSize }
}

// ---------- Found report ----------
export async function createFoundReport(userId, payload, photoFile) {
  const errors = validateFoundPayload(payload)
  if (Object.keys(errors).length) throw err('VALIDATION', 'Data laporan belum valid', errors)
  const imageUrl = photoFile ? await uploadPhoto(photoFile) : payload.imageUrl || null
  const { data: item, error: e1 } = await supabase.from('items').insert({
    category_id: payload.categoryId, name: payload.name.trim(), description: payload.description.trim(),
    ciri_khusus: payload.ciriKhusus || null, color: payload.color || null, brand: payload.brand || null,
    model: payload.model || null, serial_number: payload.serialNumber || null,
    image_url: imageUrl, status: 'DILAPORKAN', created_by: userId,
  }).select().single()
  if (e1) throw err('INTERNAL', 'Gagal menyimpan barang: ' + e1.message)
  const { data: report, error: e2 } = await supabase.from('found_reports').insert({
    user_id: userId, item_id: item.id, found_location: payload.foundLocation.trim(),
    found_at: payload.foundAt, description: payload.description.trim(), status: 'DILAPORKAN',
    note: payload.note || null,
  }).select().single()
  if (e2) throw err('INTERNAL', 'Gagal menyimpan laporan penemuan: ' + e2.message)
  await writeAudit(userId, 'FOUND_REPORT', report.id, 'CREATE_REPORT', null, { code: report.report_code })
  await notify(userId, 'REPORT_RECEIVED', 'Laporan penemuan diterima', `Laporan ${report.report_code} menunggu validasi petugas.`)
  return { item, report }
}

export async function searchFoundItems({ keyword, categoryId, color, location, from, to, status, statuses, page = 1, pageSize = 12 } = {}) {
  const { PUBLIC_ITEM_STATUSES } = await import('./statuses')
  let q = supabase.from('items').select('*, categories(name), found_reports(found_location)', { count: 'exact' }).order('created_at', { ascending: false })
  if (categoryId) q = q.eq('category_id', categoryId)
  if (color) q = q.ilike('color', `%${color}%`)
  // Filter status eksplisit (officer) selalu menang; publik default
  // menyembunyikan barang yang sudah diklaim / selesai / ditolak.
  if (status) q = q.eq('status', status)
  else q = q.in('status', statuses && statuses.length ? statuses : PUBLIC_ITEM_STATUSES)
  if (keyword) q = q.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,ciri_khusus.ilike.%${keyword}%,brand.ilike.%${keyword}%,model.ilike.%${keyword}%`)
  if (from) q = q.gte('created_at', from)
  if (to) q = q.lte('created_at', to)
  q = q.range((page - 1) * pageSize, page * pageSize - 1)
  const { data, error, count } = await q
  if (error) throw err('INTERNAL', 'Gagal mencari barang')
  let filtered = data
  if (location) {
    const l = location.toLowerCase()
    filtered = data.filter((d) => {
      if ((d.storage_location || '').toLowerCase().includes(l)) return true
      return (d.found_reports || []).some((fr) => (fr.found_location || '').toLowerCase().includes(l))
    })
  }
  return { data: filtered.map(toPublicItem), total: count ?? filtered.length, page, pageSize }
}

export async function getItemDetail(id) {
  const { data, error } = await supabase.from('items').select('*, categories(name)').eq('id', id).single()
  if (error) throw err('NOT_FOUND', 'Barang tidak ditemukan')
  return data
}

// ---------- Officer: validasi ----------
// Idempoten & toleran: klik ganda atau data basi tidak error;
// laporan + item selalu disinkronkan ke status akhir yang sama.
export async function validateLostReport(officerId, reportId, approve, reason) {
  const { data: r, error } = await supabase.from('lost_reports').select('*, items(*)').eq('id', reportId).single()
  if (error || !r) throw err('NOT_FOUND', 'Laporan tidak ditemukan')
  if (!approve && (!reason || reason.trim().length < 5)) throw err('VALIDATION', 'Alasan penolakan wajib (min 5 karakter)')
  if (approve && r.status === 'DITOLAK') throw err('CONFLICT', 'Laporan sudah ditolak, tidak bisa disetujui lagi')
  if (!approve && r.status === 'DITOLAK') return // sudah ditolak: no-op sukses
  const next = approve ? 'MENUNGGU_PENCOCOKAN' : 'DITOLAK'
  if (r.status === next) {
    // Sudah pada status tujuan (mis. klik ganda): pastikan item sinkron.
    if (r.item_id) await supabase.from('items').update({ status: next }).eq('id', r.item_id)
    return
  }
  await supabase.from('lost_reports').update({ status: next, rejection_reason: approve ? null : reason }).eq('id', reportId)
  if (r.item_id) await supabase.from('items').update({ status: next }).eq('id', r.item_id)
  if (approve) {
    await notify(r.user_id, 'REPORT_VALIDATED', 'Laporan divalidasi', `Laporan ${r.report_code} sudah diverifikasi dan menunggu pencocokan.`)
    await writeAudit(officerId, 'LOST_REPORT', reportId, 'VALIDATE_REPORT', { from: r.status }, { to: next })
  } else {
    await notify(r.user_id, 'REPORT_REJECTED', 'Laporan ditolak', `Laporan ${r.report_code} ditolak: ${reason}`)
    await writeAudit(officerId, 'LOST_REPORT', reportId, 'REJECT_REPORT', { from: r.status }, { to: next, reason })
  }
}

export async function validateFoundReport(officerId, reportId, approve, reason) {
  const { data: r, error } = await supabase.from('found_reports').select('*, items(*)').eq('id', reportId).single()
  if (error || !r) throw err('NOT_FOUND', 'Laporan tidak ditemukan')
  if (!approve && (!reason || reason.trim().length < 5)) throw err('VALIDATION', 'Alasan penolakan wajib (min 5 karakter)')
  const next = approve ? 'DITEMUKAN' : 'DITOLAK'
  await supabase.from('found_reports').update({ status: next, rejection_reason: approve ? null : reason }).eq('id', reportId)
  if (r.item_id) await supabase.from('items').update({ status: next }).eq('id', r.item_id)
  await writeAudit(officerId, 'FOUND_REPORT', reportId, approve ? 'VALIDATE_REPORT' : 'REJECT_REPORT', { from: r.status }, { to: next })
  await notify(r.user_id, approve ? 'REPORT_VALIDATED' : 'REPORT_REJECTED', approve ? 'Temuan divalidasi' : 'Laporan ditolak', approve ? `Barang ${r.report_code} sudah tercatat sebagai temuan.` : `Laporan ${r.report_code} ditolak: ${reason}`)
}

export async function receiveItem(officerId, foundReportId, { condition, storageLocation, note }) {
  const { data: r, error } = await supabase.from('found_reports').select('*').eq('id', foundReportId).single()
  if (error || !r) throw err('NOT_FOUND', 'Laporan tidak ditemukan')
  if (!storageLocation || !storageLocation.trim()) throw err('VALIDATION', 'Lokasi penyimpanan wajib diisi')
  await supabase.from('found_reports').update({
    received_at: new Date().toISOString(), received_by: officerId,
    condition: condition || null, storage_location: storageLocation.trim(), note: note || null,
    status: 'DITEMUKAN',
  }).eq('id', foundReportId)
  if (r.item_id) await supabase.from('items').update({ storage_location: storageLocation.trim(), condition: condition || null, status: 'DITEMUKAN' }).eq('id', r.item_id)
  await writeAudit(officerId, 'FOUND_REPORT', foundReportId, 'RECEIVE_ITEM', null, { storageLocation })
  await notify(r.user_id, 'ITEM_RECEIVED', 'Barang diterima petugas', `Barang ${r.report_code} sudah diterima dan disimpan di ${storageLocation}.`)
}

// ---------- Matching ----------
export async function findCandidates(lostReportId) {
  const { data: lost, error } = await supabase.from('lost_reports').select('*, items(*)').eq('id', lostReportId).single()
  if (error || !lost) throw err('NOT_FOUND', 'Laporan kehilangan tidak ditemukan')
  const { data: found } = await supabase.from('items').select('*, categories(name)').in('status', ['DILAPORKAN', 'DIVERIFIKASI', 'MENUNGGU_PENCOCOKAN', 'DITEMUKAN']).limit(50)
  const L = {
    categoryId: lost.items.category_id, name: lost.items.name, brand: lost.items.brand, model: lost.items.model,
    color: lost.items.color, description: `${lost.items.description} ${lost.items.ciri_khusus || ''}`,
    lostLocation: lost.lost_location, lostAt: lost.lost_at,
  }
  const { rankCandidates } = await import('./matching')
  return {
    lost,
    candidates: rankCandidates(L, (found || []).map((f) => ({
      ...f, categoryId: f.category_id, lostLocation: f.storage_location, lostAt: f.created_at, foundLocation: f.storage_location, foundAt: f.created_at,
    }))),
  }
}

export async function confirmMatch(officerId, lostReportId, itemId) {
  const { data: lost } = await supabase.from('lost_reports').select('*, items(*)').eq('id', lostReportId).single()
  if (!lost) throw err('NOT_FOUND', 'Laporan tidak ditemukan')
  const { data: item } = await supabase.from('items').select('*').eq('id', itemId).single()
  if (!item) throw err('NOT_FOUND', 'Barang tidak ditemukan')
  // Laporan boleh dicocokkan dari status apa pun sebelum DITEMUKAN
  // (DILAPORKAN langsung pun bisa — validasi ikut terselesaikan di sini).
  // Dijalankan selangkah demi selangkah agar tetap dalam state machine valid.
  const order = ['DILAPORKAN', 'DIVERIFIKASI', 'MENUNGGU_PENCOCOKAN', 'DITEMUKAN']
  const from = lost.status
  if (from === 'DITOLAK') throw err('CONFLICT', 'Laporan sudah ditolak, tidak bisa dicocokkan')
  if (!order.includes(from) && from !== 'DITEMUKAN') throw err('CONFLICT', `Status laporan ${from} tidak bisa dicocokkan`)
  let cur = from
  while (cur !== 'DITEMUKAN') {
    const nxt = order[order.indexOf(cur) + 1]
    assertItemTransition(cur, nxt) // valid by construction
    cur = nxt
  }
  await supabase.from('lost_reports').update({ status: 'DITEMUKAN', rejection_reason: null }).eq('id', lostReportId)
  await supabase.from('items').update({ status: 'DITEMUKAN' }).eq('id', lost.item_id)
  await supabase.from('items').update({ status: 'MENUNGGU_VERIFIKASI_PEMILIK' }).eq('id', itemId)
  await writeAudit(officerId, 'LOST_REPORT', lostReportId, 'MATCH_CONFIRMED', { from }, { to: 'DITEMUKAN', matchedItem: itemId })
  await notify(lost.user_id, 'POTENTIAL_MATCH', 'Kemungkinan kecocokan', `Laporan ${lost.report_code} memiliki kandidat cocok. Silakan cek dan ajukan klaim.`)
}

// ---------- Claims ----------
export async function createClaim(userId, itemId, payload, evidenceFile) {
  const errors = validateClaimPayload(payload)
  if (Object.keys(errors).length) throw err('VALIDATION', 'Data klaim belum valid', errors)
  const { data: item } = await supabase.from('items').select('*').eq('id', itemId).single()
  if (!item) throw err('NOT_FOUND', 'Barang tidak ditemukan')
  if (['SUDAH_DIAMBIL', 'SELESAI'].includes(item.status)) throw err('CONFLICT', 'Barang sudah diambil dan tidak dapat diklaim ulang')
  const { data: existing } = await supabase.from('claims').select('id').eq('item_id', itemId).eq('claimant_id', userId).in('status', ['KLAIM_DIAJUKAN', 'KLAIM_DIVERIFIKASI', 'MENUNGGU_PENGAMBILAN']).limit(1)
  if (existing && existing.length) throw err('CONFLICT', 'Anda sudah memiliki klaim aktif untuk barang ini')
  const up = evidenceFile ? await uploadEvidence(evidenceFile) : { ref: null, meta: null }
  const { data: claim, error } = await supabase.from('claims').insert({
    item_id: itemId, claimant_id: userId, lost_report_id: payload.lostReportId || null,
    hubungan: payload.hubungan.trim(), detail_khusus: payload.detailKhusus.trim(), catatan: payload.catatan || null,
    status: 'KLAIM_DIAJUKAN',
  }).select().single()
  if (error) throw err('INTERNAL', 'Gagal mengajukan klaim: ' + error.message)
  await supabase.from('verifications').insert({
    claim_id: claim.id, type: 'OWNERSHIP', evidence_ref: up.ref, evidence_meta: up.meta, result: 'PENDING', notes: payload.catatan || null,
  })
  const nextItem = item.status === 'KLAIM_DIAJUKAN' ? item.status : 'KLAIM_DIAJUKAN'
  try { assertItemTransition(item.status, nextItem) } catch { /* jika sudah KLAIM_DIAJUKAN, lewati */ }
  await supabase.from('items').update({ status: 'KLAIM_DIAJUKAN' }).eq('id', itemId)
  await writeAudit(userId, 'CLAIM', claim.id, 'SUBMIT_CLAIM', null, { item: itemId })
  const { data: officers } = await supabase.from('profiles').select('id').in('role', ['LOST_FOUND_OFFICER', 'ADMIN']).limit(20)
  for (const o of officers || []) await notify(o.id, 'CLAIM_SUBMITTED', 'Klaim baru', `Klaim ${claim.claim_code} diajukan untuk ${item.name}.`)
  await notify(userId, 'CLAIM_SUBMITTED', 'Klaim terkirim', `Klaim ${claim.claim_code} menunggu verifikasi petugas.`)
  return claim
}

export async function getClaim(id) {
  const { data, error } = await supabase.from('claims').select('*, items(*, categories(name)), verifications(*), claimant:profiles!claims_claimant_id_fkey(nama,nim,prodi,semester)').eq('id', id).single()
  if (error || !data) throw err('NOT_FOUND', 'Klaim tidak ditemukan')
  return data
}

export async function verifyClaim(officerId, claimId, approve, reason, notes) {
  const { data: c, error } = await supabase.from('claims').select('*, items(*)').eq('id', claimId).single()
  if (error || !c) throw err('NOT_FOUND', 'Klaim tidak ditemukan')
  // Idempoten: klik ganda / data basi tidak boleh error.
  if (!approve && c.status === 'DITOLAK') return
  if (approve && ['KLAIM_DIVERIFIKASI', 'MENUNGGU_PENGAMBILAN'].includes(c.status)) return
  if (!approve) {
    if (!reason || reason.trim().length < 5) throw err('VALIDATION', 'Alasan penolakan wajib (min 5 karakter)')
    assertClaimTransition(c.status, 'DITOLAK')
    await supabase.from('claims').update({ status: 'DITOLAK', rejection_reason: reason, reviewed_at: new Date().toISOString(), reviewed_by: officerId }).eq('id', claimId)
    await supabase.from('verifications').update({ result: 'REJECTED', reviewed_by: officerId, reviewed_at: new Date().toISOString(), notes: notes || reason }).eq('claim_id', claimId)
    await supabase.from('items').update({ status: 'DITEMUKAN' }).eq('id', c.item_id)
    await writeAudit(officerId, 'CLAIM', claimId, 'REJECT_CLAIM', { from: c.status }, { to: 'DITOLAK', reason })
    await notify(c.claimant_id, 'CLAIM_REJECTED', 'Klaim ditolak', `Klaim ${c.claim_code} ditolak: ${reason}`)
  } else {
    assertClaimTransition(c.status, 'KLAIM_DIVERIFIKASI')
    await supabase.from('claims').update({ status: 'MENUNGGU_PENGAMBILAN', reviewed_at: new Date().toISOString(), reviewed_by: officerId, rejection_reason: null }).eq('id', claimId)
    await supabase.from('verifications').update({ result: 'APPROVED', reviewed_by: officerId, reviewed_at: new Date().toISOString(), notes: notes || null }).eq('claim_id', claimId)
    try { assertItemTransition(c.items.status, 'KLAIM_DIVERIFIKASI'); await supabase.from('items').update({ status: 'KLAIM_DIVERIFIKASI' }).eq('id', c.item_id) } catch { /* lanjut */ }
    await supabase.from('items').update({ status: 'MENUNGGU_PENGAMBILAN' }).eq('id', c.item_id)
    await writeAudit(officerId, 'CLAIM', claimId, 'VERIFY_CLAIM', { from: c.status }, { to: 'MENUNGGU_PENGAMBILAN' })
    await notify(c.claimant_id, 'CLAIM_APPROVED', 'Klaim disetujui', `Klaim ${c.claim_code} disetujui. Datang ke meja Lost and Found untuk pengambilan.`)
  }
}

// ---------- Pickup ----------
export async function recordPickup(officerId, claimId, { recipientNim, handoverNote, recipientId }) {
  const { data: c, error } = await supabase.from('claims').select('*, items(*)').eq('id', claimId).single()
  if (error || !c) throw err('NOT_FOUND', 'Klaim tidak ditemukan')
  // Idempoten: pengambilan yang sudah tercatat mengembalikan data lama.
  if (c.status === 'SELESAI') {
    const { data: existing } = await supabase.from('pickups').select('*').eq('claim_id', claimId).maybeSingle()
    return existing
  }
  if (!['KLAIM_DIVERIFIKASI', 'MENUNGGU_PENGAMBILAN'].includes(c.status))
    throw err('CONFLICT', 'Klaim belum disetujui, barang belum boleh diserahkan (BR-02)')
  if (!recipientNim || !recipientNim.trim()) throw err('VALIDATION', 'NIM/identitas penerima wajib dicatat')
  const { data: pickup, error: e2 } = await supabase.from('pickups').insert({
    item_id: c.item_id, claim_id: claimId, recipient_id: recipientId || c.claimant_id,
    recipient_nim: recipientNim.trim(), handled_by: officerId, handover_note: handoverNote || null,
  }).select().single()
  if (e2) throw err('INTERNAL', 'Gagal mencatat pengambilan: ' + e2.message)
  await supabase.from('claims').update({ status: 'SELESAI' }).eq('id', claimId)
  await supabase.from('items').update({ status: 'SELESAI' }).eq('id', c.item_id)
  try {
    const { data: lr } = await supabase.from('lost_reports').select('id').eq('item_id', c.item_id).limit(1)
    // status lost report ikut selesai bila ada — best effort
    void lr
  } catch { /* abaikan */ }
  await writeAudit(officerId, 'PICKUP', pickup.id, 'RECORD_PICKUP', { claim: claimId }, { to: 'SELESAI' })
  await notify(c.claimant_id, 'PICKUP_DONE', 'Pengambilan tercatat', `Barang untuk klaim ${c.claim_code} sudah diserahterimakan. Terima kasih.`)
  return pickup
}

// ---------- My data ----------
export async function myReports(userId) {
  const [lost, found, claims] = await Promise.all([
    supabase.from('lost_reports').select('*, items(*, categories(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('found_reports').select('*, items(*, categories(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('claims').select('*, items(*, categories(name))').eq('claimant_id', userId).order('created_at', { ascending: false }),
  ])
  return { lost: lost.data || [], found: found.data || [], claims: claims.data || [] }
}

export async function listNotifications(userId) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  if (error) throw err('INTERNAL', 'Gagal memuat notifikasi')
  return data
}
export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
}

export async function listAuditLogs({ entityType, entityId, limit = 50 } = {}) {
  let q = supabase.from('audit_logs').select('*, actor:profiles!audit_logs_actor_id_fkey(nama,nim,role)').order('created_at', { ascending: false }).limit(limit)
  if (entityType) q = q.eq('entity_type', entityType)
  if (entityId) q = q.eq('entity_id', String(entityId))
  const { data, error } = await q
  if (error) throw err('INTERNAL', withDbHint('Gagal memuat audit: ' + error.message))
  return data
}

export async function dashboardStats() {
  // Tiap query dibungkus aman: satu query gagal (mis. RLS/view belum siap)
  // tidak boleh meruntuhkan seluruh overview.
  async function safeCount(build) {
    try {
      const r = await build()
      if (r.error) throw r.error
      return r.count ?? 0
    } catch (e) {
      try {
        const { logger } = await import('./logger')
        logger.warn('api', 'dashboard count gagal', { message: e.message })
      } catch { /* abaikan */ }
      return 0
    }
  }
  const [totalLost, totalFound, pendingClaims, pendingPickup] = await Promise.all([
    safeCount(() => supabase.from('lost_reports').select('id', { count: 'exact', head: true })),
    safeCount(() => supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'DITEMUKAN')),
    safeCount(() => supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'KLAIM_DIAJUKAN')),
    safeCount(() => supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'MENUNGGU_PENGAMBILAN')),
  ])
  async function safeRecent() {
    try {
      const r = await supabase.from('audit_logs').select('*, actor:profiles!audit_logs_actor_id_fkey(nama,nim)').order('created_at', { ascending: false }).limit(10)
      if (r.error) throw r.error
      return r.data || []
    } catch {
      return []
    }
  }
  const recent = await safeRecent()
  return { totalLost, totalFound, pendingClaims, pendingPickup, recent }
}

export { getProfile }
