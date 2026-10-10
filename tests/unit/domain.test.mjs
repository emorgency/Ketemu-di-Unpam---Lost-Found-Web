// Unit tests tanpa framework (node --test). Jalankan: node --test tests/unit/domain.test.mjs
// Meliputi T-032: validasi input, transisi status, claim rules, permission, matching.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { canTransitionItem, canTransitionClaim, StatusTransitionError, assertItemTransition } from '../../frontend/src/lib/statuses.js'
import { validateLostReport, validateClaim, validateRejection, validateProfile } from '../../frontend/src/lib/validation.js'
import { can } from '../../frontend/src/lib/permissions.js'
import { scoreMatch } from '../../frontend/src/lib/matching.js'
import { friendlyAuthError } from '../../frontend/src/lib/authErrors.js'
import { PUBLIC_ITEM_STATUSES } from '../../frontend/src/lib/statuses.js'

describe('status transition', () => {
  it('alur utama valid', () => {
    assert.equal(canTransitionItem('DILAPORKAN', 'DIVERIFIKASI'), true)
    assert.equal(canTransitionItem('MENUNGGU_PENGAMBILAN', 'SUDAH_DIAMBIL'), true)
    assert.equal(canTransitionClaim('KLAIM_DIAJUKAN', 'KLAIM_DIVERIFIKASI'), true)
  })
  it('transisi invalid ditolak', () => {
    assert.equal(canTransitionItem('SUDAH_DIAMBIL', 'DILAPORKAN'), false)
    assert.throws(() => assertItemTransition('SUDAH_DIAMBIL', 'DILAPORKAN'), StatusTransitionError)
    assert.equal(canTransitionClaim('KLAIM_DIAJUKAN', 'SELESAI'), false)
  })
  it('cabang DITOLAK valid', () => {
    assert.equal(canTransitionItem('DILAPORKAN', 'DITOLAK'), true)
    assert.equal(canTransitionClaim('KLAIM_DIAJUKAN', 'DITOLAK'), true)
  })
})

describe('validation', () => {
  it('lost report wajib lengkap', () => {
    const e = validateLostReport({ name: 'a', description: 'pendek', lostLocation: '', lostAt: '' })
    assert.ok(e.categoryId && e.name && e.description && e.lostLocation && e.lostAt)
  })
  it('claim wajib detail khusus', () => {
    const e = validateClaim({ hubungan: '', detailKhusus: 'pendek' })
    assert.ok(e.hubungan && e.detailKhusus)
  })
  it('penolakan wajib alasan', () => {
    assert.ok(validateRejection('') !== null)
    assert.equal(validateRejection('detail tidak cocok'), null)
  })
  it('profil wajib nama, format semester benar', () => {
    assert.ok(validateProfile({ nama: 'ab' }).nama)
    assert.ok(validateProfile({ nama: 'Budi', semester: '15' }).semester)
    assert.deepEqual(validateProfile({ nama: 'Budi Santoso', semester: '3', prodi: 'Informatika' }), {})
  })
})

describe('permissions', () => {
  it('USER tidak bisa verifikasi', () => {
    assert.equal(can('USER', 'verify_claim'), false)
    assert.equal(can('LOST_FOUND_OFFICER', 'verify_claim'), true)
    assert.equal(can('ADMIN', 'manage_users'), true)
  })
})

describe('matching', () => {
  it('barang sama skor tinggi', () => {
    const lost = { categoryId: 'c1', name: 'Dompet kulit hitam', brand: 'Eiger', model: '', color: 'Hitam', description: 'dompet kulit ada KTP', lostLocation: 'Gedung A', lostAt: '2026-09-20T10:00:00Z' }
    const same = { categoryId: 'c1', name: 'Dompet kulit hitam', brand: 'Eiger', model: '', color: 'hitam', description: 'dompet kulit berisi KTP', foundLocation: 'Gedung A', foundAt: '2026-09-21T10:00:00Z' }
    const diff = { categoryId: 'c2', name: 'Laptop silver', brand: 'Asus', model: '', color: 'Silver', description: 'laptop gaming', foundLocation: 'Lab', foundAt: '2026-01-01T10:00:00Z' }
    assert.ok(scoreMatch(lost, same).score > scoreMatch(lost, diff).score)
    assert.ok(scoreMatch(lost, same).score >= 60)
  })
})

describe('public visibility', () => {
  it('barang yang sudah diklaim tidak tampil di pencarian publik', () => {
    for (const s of ['KLAIM_DIAJUKAN', 'KLAIM_DIVERIFIKASI', 'MENUNGGU_PENGAMBILAN', 'SUDAH_DIAMBIL', 'SELESAI', 'DITOLAK']) {
      assert.ok(!PUBLIC_ITEM_STATUSES.includes(s), `${s} harus disembunyikan`)
    }
    assert.ok(PUBLIC_ITEM_STATUSES.includes('DITEMUKAN'))
  })
})

describe('auth errors', () => {
  it('menerjemahkan error umum', () => {
    assert.match(friendlyAuthError(new Error('User already registered')), /sudah terdaftar/)
    assert.match(friendlyAuthError({ message: 'Email rate limit exceeded', status: 429 }), /Terlalu banyak/)
    assert.match(friendlyAuthError(new Error('Invalid login credentials')), /salah/)
  })
})
