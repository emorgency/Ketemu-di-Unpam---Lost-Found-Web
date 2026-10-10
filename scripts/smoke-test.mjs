// T-038 smoke test: verifikasi artefak tanpa butuh kredensial Supabase.
// Jalankan: node scripts/smoke-test.mjs (dari folder project/)
// Keluar kode 0 bila lolos, 1 bila ada yang gagal.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0

function check(name, cond, hint = '') {
  if (cond) {
    console.log(`  [OK] ${name}`)
  } else {
    failures++
    console.log(`  [FAIL] ${name}${hint ? ' — ' + hint : ''}`)
  }
}

console.log('Smoke test: Campus Lost and Found MVP')

// 1. Dokumen waterfall
for (const f of ['docs/REQUIREMENTS_TRACEABILITY.md', 'docs/USE_CASES.md', 'docs/ERD.md', 'docs/API.md', 'docs/TECHNICAL.md', 'docs/USER_GUIDE.md', 'docs/TEST_PLAN.md', 'docs/DEPLOYMENT.md', 'docs/MONITORING.md']) {
  check(f, existsSync(join(root, f)))
}

// 2. Supabase artefak
const schema = existsSync(join(root, 'supabase/schema.sql')) ? readFileSync(join(root, 'supabase/schema.sql'), 'utf8') : ''
check('supabase/schema.sql ada', schema.length > 1000)
for (const t of ['profiles', 'categories', 'items', 'lost_reports', 'found_reports', 'claims', 'verifications', 'pickups', 'notifications', 'audit_logs']) {
  check(`tabel ${t}`, schema.includes(t))
}
for (const b of ['item-photos', 'evidence']) {
  check(`bucket ${b}`, schema.includes(b))
}
check('supabase/seed.sql ada', existsSync(join(root, 'supabase/seed.sql')))
check('supabase/migrations/002_app_logs.sql ada', existsSync(join(root, 'supabase/migrations/002_app_logs.sql')))
check('supabase/migrations/003_handle_new_user.sql ada', existsSync(join(root, 'supabase/migrations/003_handle_new_user.sql')))
check('supabase/migrations/004_no_role_escalation.sql ada', existsSync(join(root, 'supabase/migrations/004_no_role_escalation.sql')))
check('supabase/migrations/005_fix_code_triggers.sql ada', existsSync(join(root, 'supabase/migrations/005_fix_code_triggers.sql')))
check('supabase/migrations/006_profile_fields.sql ada', existsSync(join(root, 'supabase/migrations/006_profile_fields.sql')))
check('supabase/migrations/007_security_definer_helpers.sql ada', existsSync(join(root, 'supabase/migrations/007_security_definer_helpers.sql')))
check('komponen BackButton ada', existsSync(join(root, 'frontend/src/components/BackButton.jsx')))
check('halaman Profil ada', existsSync(join(root, 'frontend/src/pages/user/Profile.jsx')))
check('helper realtime ada', existsSync(join(root, 'frontend/src/lib/realtime.js')))

// Regresi kapitalisasi: kode status DB wajib UPPERCASE dalam query/komparasi.
// (Label tampilan "Dilaporkan" hanya boleh ada di lib/statuses.js.)
{
  // Regresi kapitalisasi: kode status DB wajib UPPERCASE dalam komparasi/query.
  // (Label tampilan "Diajukan" pada tombol filter sah — yang dilarang hanya
  // pemakaian sebagai nilai banding/query. Label sah hanya di statuses.js.)
  const badVals = ['Dilaporkan', 'Diverifikasi', 'Menunggu_Pencocokan', 'Ditemukan',
    'Menunggu_Verifikasi_Pemilik', 'Klaim_Diajukan', 'Klaim_Diverifikasi',
    'Menunggu_Pengambilan', 'Sudah_Diambil', 'Selesai', 'Ditolak']
  const hits = []
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (!/\.(jsx|js)$/.test(e.name)) continue
      if (e.name === 'statuses.js') continue
      const lines = readFileSync(p, 'utf8').split('\n')
      lines.forEach((ln, i) => {
        const code = ln.replace(/\/\/.*$/, '')
        const isCmp = /([=!]==|eq\(|in\()/.test(code)
        if (!isCmp) return
        for (const b of badVals) {
          if (code.includes(`'${b}'`) || code.includes(`"${b}"`)) hits.push(`${p.replace(root + '/', '')}:${i + 1} '${b}'`)
        }
      })
    }
  }
  walk(join(root, 'frontend/src'))
  check('tidak ada kode status huruf-kecil di query/komparasi', hits.length === 0, hits.slice(0, 5).join(', '))
}

// 3. Domain lib
for (const f of ['frontend/src/lib/statuses.js', 'frontend/src/lib/permissions.js', 'frontend/src/lib/validation.js', 'frontend/src/lib/matching.js', 'frontend/src/lib/api.js', 'frontend/src/lib/logger.js']) {
  check(f, existsSync(join(root, f)))
}

// 4. Routes utama di App.jsx
const app = existsSync(join(root, 'frontend/src/App.jsx')) ? readFileSync(join(root, 'frontend/src/App.jsx'), 'utf8') : ''
for (const r of ['/search', '/lapor-hilang', '/lapor-temu', '/laporan-saya', '/klaim/:id', '/officer', '/officer/claims', '/officer/pickup', '/admin/users']) {
  check(`route ${r}`, app.includes(`"${r}"`) || app.includes(`'${r}'`) || app.includes(r))
}

// 5. Guard domain: tidak ada istilah UKM di halaman aktif
const pagesDir = join(root, 'frontend/src/pages')
let ukmHits = []
try {
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(jsx|js)$/.test(e.name)) {
        const c = readFileSync(p, 'utf8')
        if (/ukm/i.test(c)) ukmHits.push(p.replace(root + '/', ''))
      }
    }
  }
  walk(pagesDir)
} catch { /* abaikan */ }
check('tidak ada sisa domain UKM di pages/', ukmHits.length === 0, ukmHits.join(', '))

// 6. Env: .env.example ada, .env tidak ikut repo bila ada .gitignore
check('frontend/.env.example ada', existsSync(join(root, 'frontend/.env.example')))
const gitignore = existsSync(join(root, 'frontend/.gitignore')) ? readFileSync(join(root, 'frontend/.gitignore'), 'utf8') : ''
check('.env di-ignore', gitignore.includes('.env'))

// 7. Secret tidak tertulis di dokumen (cek pola anon key)
let secretLeak = false
for (const f of ['docs/TECHNICAL.md', 'docs/DEPLOYMENT.md', 'supabase/README.md']) {
  const p = join(root, f)
  if (existsSync(p) && /eyJ[A-Za-z0-9_-]{20,}/.test(readFileSync(p, 'utf8'))) secretLeak = true
}
check('tidak ada secret di docs/', !secretLeak)

console.log(failures === 0 ? '\nSMOKE PASS' : `\nSMOKE FAIL (${failures} kegagalan)`)
process.exit(failures === 0 ? 0 : 1)
