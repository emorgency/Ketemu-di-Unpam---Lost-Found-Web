// T-038 deploy check: validasi kesiapan deploy ke production.
// Jalankan: node scripts/deploy-check.mjs (dari folder project/)
// Mengecek: env production, format URL Supabase, keberadaan dist, migrasi DB.

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0

function check(name, cond, hint = '') {
  if (cond) console.log(`  [OK] ${name}`)
  else {
    failures++
    console.log(`  [FAIL] ${name}${hint ? ' — ' + hint : ''}`)
  }
}

console.log('Deploy check: Campus Lost and Found')

// 1. Env (dibaca dari frontend/.env bila ada; di CI dari environment)
let url = process.env.VITE_SUPABASE_URL || ''
let key = process.env.VITE_SUPABASE_ANON_KEY || ''
try {
  const envPath = join(root, 'frontend/.env')
  if (existsSync(envPath)) {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)\s*$/)
      if (m) url = url || m[1].trim()
      const k = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+)\s*$/)
      if (k) key = key || k[1].trim()
    }
  }
} catch { /* abaikan */ }

check('VITE_SUPABASE_URL terisi', url.length > 0, 'isi frontend/.env (lihat .env.example)')
check('URL Supabase valid', /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url), `nilai: ${url.slice(0, 30)}...`)
check('VITE_SUPABASE_ANON_KEY terisi', key.length > 40, 'gunakan anon key, bukan service_role')
check('bukan service_role key', !/service_role/i.test(key))

// 2. Build output
check('frontend/dist/index.html ada (sudah build)', existsSync(join(root, 'frontend/dist/index.html')), 'jalankan: cd frontend && npm install && npm run build')

// 3. Migrasi DB versi
check('schema.sql ada', existsSync(join(root, 'supabase/schema.sql')))
for (const m of ['002_app_logs', '003_handle_new_user', '004_no_role_escalation', '005_fix_code_triggers', '006_profile_fields', '007_security_definer_helpers']) {
  check(`${m}.sql ada`, existsSync(join(root, `supabase/migrations/${m}.sql`)), 'sinkronkan semua migrasi di SQL Editor prod')
}

// 4. RLS aktif di schema
const schema = existsSync(join(root, 'supabase/schema.sql')) ? readFileSync(join(root, 'supabase/schema.sql'), 'utf8') : ''
check('RLS diaktifkan (enable row level security)', schema.includes('enable row level security'))

console.log(failures === 0 ? '\nDEPLOY CHECK PASS — siap deploy, lanjutkan smoke test manual (docs/DEPLOYMENT.md §4)' : `\nDEPLOY CHECK FAIL (${failures} item) — perbaiki sebelum deploy`)
process.exit(failures === 0 ? 0 : 1)
