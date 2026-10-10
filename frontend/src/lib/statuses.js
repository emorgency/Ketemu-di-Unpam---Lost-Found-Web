// Domain: status lifecycle (AGENTS.md §4, ARCHITECTURE.md §6, PRD FR-10)
// Sumber kebenaran untuk transisi valid item & claim.

export const ITEM_STATUSES = [
  'DILAPORKAN',
  'DIVERIFIKASI',
  'MENUNGGU_PENCOCOKAN',
  'DITEMUKAN',
  'MENUNGGU_VERIFIKASI_PEMILIK',
  'KLAIM_DIAJUKAN',
  'KLAIM_DIVERIFIKASI',
  'MENUNGGU_PENGAMBILAN',
  'SUDAH_DIAMBIL',
  'SELESAI',
  'DITOLAK',
]

export const CLAIM_STATUSES = [
  'KLAIM_DIAJUKAN',
  'KLAIM_DIVERIFIKASI',
  'MENUNGGU_PENGAMBILAN',
  'SUDAH_DIAMBIL',
  'SELESAI',
  'DITOLAK',
]

// Alur utama + cabang penolakan. Setiap key = status asal, value = daftar tujuan valid.
export const ALLOWED_ITEM_TRANSITIONS = {
  DILAPORKAN: ['DIVERIFIKASI', 'DITOLAK'],
  DIVERIFIKASI: ['MENUNGGU_PENCOCOKAN', 'DITOLAK'],
  MENUNGGU_PENCOCOKAN: ['DITEMUKAN', 'MENUNGGU_PENCOCOKAN'],
  DITEMUKAN: ['MENUNGGU_VERIFIKASI_PEMILIK', 'KLAIM_DIAJUKAN'],
  MENUNGGU_VERIFIKASI_PEMILIK: ['KLAIM_DIAJUKAN', 'DITEMUKAN'],
  KLAIM_DIAJUKAN: ['KLAIM_DIVERIFIKASI', 'DITOLAK', 'DITEMUKAN'],
  KLAIM_DIVERIFIKASI: ['MENUNGGU_PENGAMBILAN'],
  MENUNGGU_PENGAMBILAN: ['SUDAH_DIAMBIL'],
  SUDAH_DIAMBIL: ['SELESAI'],
  SELESAI: [],
  DITOLAK: [],
}

export const ALLOWED_CLAIM_TRANSITIONS = {
  KLAIM_DIAJUKAN: ['KLAIM_DIVERIFIKASI', 'DITOLAK'],
  KLAIM_DIVERIFIKASI: ['MENUNGGU_PENGAMBILAN'],
  MENUNGGU_PENGAMBILAN: ['SUDAH_DIAMBIL'],
  SUDAH_DIAMBIL: ['SELESAI'],
  SELESAI: [],
  DITOLAK: [],
}

export class StatusTransitionError extends Error {
  constructor(from, to) {
    super(`Transisi status tidak valid: ${from} → ${to}`)
    this.name = 'StatusTransitionError'
    this.code = 'CONFLICT'
    this.from = from
    this.to = to
  }
}

export function canTransitionItem(from, to) {
  if (from === to) return true
  return (ALLOWED_ITEM_TRANSITIONS[from] || []).includes(to)
}

export function canTransitionClaim(from, to) {
  if (from === to) return true
  return (ALLOWED_CLAIM_TRANSITIONS[from] || []).includes(to)
}

export function assertItemTransition(from, to) {
  if (!canTransitionItem(from, to)) throw new StatusTransitionError(from, to)
}

export function assertClaimTransition(from, to) {
  if (!canTransitionClaim(from, to)) throw new StatusTransitionError(from, to)
}

export const STATUS_LABEL = {
  DILAPORKAN: 'Dilaporkan',
  DIVERIFIKASI: 'Diverifikasi',
  MENUNGGU_PENCOCOKAN: 'Menunggu Pencocokan',
  DITEMUKAN: 'Ditemukan',
  MENUNGGU_VERIFIKASI_PEMILIK: 'Menunggu Verifikasi Pemilik',
  KLAIM_DIAJUKAN: 'Klaim Diajukan',
  KLAIM_DIVERIFIKASI: 'Klaim Diverifikasi',
  MENUNGGU_PENGAMBILAN: 'Menunggu Pengambilan',
  SUDAH_DIAMBIL: 'Sudah Diambil',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
}

export function statusLabel(s) {
  return STATUS_LABEL[s] || s
}

// Status yang boleh tampil di pencarian publik & beranda.
// Barang yang sudah diklaim / dalam serah terima / selesai / ditolak
// TIDAK tampil (aturan: "yang sudah diklaim harus hilang dari pencarian").
export const PUBLIC_ITEM_STATUSES = [
  'DITEMUKAN',
  'MENUNGGU_VERIFIKASI_PEMILIK',
  'MENUNGGU_PENCOCOKAN',
  'DIVERIFIKASI',
]
