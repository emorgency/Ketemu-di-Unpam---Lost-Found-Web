// Schema validation input (AGENTS.md §3). Tanpa dependensi eksternal agar ringan.

function required(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

export function validateLostReport(p) {
  const errors = {}
  if (!required(p.categoryId)) errors.categoryId = 'Kategori wajib diisi'
  if (!required(p.name) || String(p.name).trim().length < 3) errors.name = 'Nama barang minimal 3 karakter'
  if (!required(p.description) || String(p.description).trim().length < 10) errors.description = 'Deskripsi minimal 10 karakter'
  if (!required(p.lostLocation)) errors.lostLocation = 'Lokasi kehilangan wajib diisi'
  if (!required(p.lostAt)) errors.lostAt = 'Waktu kehilangan wajib diisi'
  if (p.lostAt && new Date(p.lostAt) > new Date()) errors.lostAt = 'Waktu kehilangan tidak boleh di masa depan'
  return errors
}

export function validateFoundReport(p) {
  const errors = {}
  if (!required(p.categoryId)) errors.categoryId = 'Kategori wajib diisi'
  if (!required(p.name) || String(p.name).trim().length < 3) errors.name = 'Nama barang minimal 3 karakter'
  if (!required(p.description) || String(p.description).trim().length < 10) errors.description = 'Deskripsi minimal 10 karakter'
  if (!required(p.foundLocation)) errors.foundLocation = 'Lokasi ditemukan wajib diisi'
  if (!required(p.foundAt)) errors.foundAt = 'Waktu ditemukan wajib diisi'
  if (p.foundAt && new Date(p.foundAt) > new Date()) errors.foundAt = 'Waktu ditemukan tidak boleh di masa depan'
  return errors
}

export function validateClaim(p) {
  const errors = {}
  if (!required(p.hubungan)) errors.hubungan = 'Hubungan dengan barang wajib diisi'
  if (!required(p.detailKhusus) || String(p.detailKhusus).trim().length < 10)
    errors.detailKhusus = 'Detail khusus minimal 10 karakter (hanya diketahui pemilik)'
  return errors
}

export function validateProfile(p) {
  const errors = {}
  if (!required(p.nama) || String(p.nama).trim().length < 3) errors.nama = 'Nama minimal 3 karakter'
  if (p.phone && !/^[0-9+()\-.\s]{8,20}$/.test(String(p.phone).trim())) errors.phone = 'Nomor telepon tidak valid'
  if (p.semester && !/^(1[0-4]|[1-9])$/.test(String(p.semester).trim())) errors.semester = 'Semester 1–14'
  if (p.prodi && String(p.prodi).trim().length < 3) errors.prodi = 'Nama prodi minimal 3 karakter'
  if (p.staffNo && String(p.staffNo).trim().length < 3) errors.staffNo = 'No. validasi staff minimal 3 karakter'
  return errors
}

export function validateRejection(reason) {
  if (!required(reason) || String(reason).trim().length < 5) return 'Alasan penolakan wajib (min 5 karakter)'
  return null
}

const IMG_OK = ['image/jpeg', 'image/png', 'image/webp']
export function validateImageFile(f, maxMB = 5) {
  if (!f) return null
  if (!IMG_OK.includes(f.type)) return 'Foto harus JPG/PNG/WebP'
  if (f.size > maxMB * 1024 * 1024) return `Ukuran maksimal ${maxMB}MB`
  return null
}

export function validateEvidenceFile(f, maxMB = 10) {
  if (!f) return null
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!ok.includes(f.type)) return 'Bukti harus JPG/PNG/WebP/PDF'
  if (f.size > maxMB * 1024 * 1024) return `Ukuran maksimal ${maxMB}MB`
  return null
}
