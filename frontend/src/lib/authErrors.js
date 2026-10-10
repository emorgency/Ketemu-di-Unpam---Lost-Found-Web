// Pesan error Supabase Auth diterjemahkan ke bahasa yang bisa ditindaklanjuti user.

export function friendlyAuthError(err) {
  const raw = err?.message || String(err || '')
  const code = err?.code || err?.status
  const map = [
    [/user already registered/i, 'NIM ini sudah terdaftar. Silakan login dengan password yang sama.'],
    [/email not confirmed/i, 'Akun belum dikonfirmasi. Buka Supabase → Authentication → Users → pilih user → Confirm email, atau matikan "Confirm email" lalu daftar ulang (lihat supabase/README.md).'],
    [/invalid login credentials/i, 'NIM atau password salah.'],
    [/password should be at least/i, 'Password minimal 6 karakter.'],
    [/email rate limit exceeded|rate limit|429/i, 'Terlalu banyak percobaan login/daftar. Tunggu 10–60 menit lalu coba lagi (ini batas Supabase, bukan bug aplikasi).'],
    [/database error saving new user/i, 'Database menolak pendaftaran (biasanya trigger warisan di auth.users — lihat supabase/README.md bagian D).'],
    [/weak password/i, 'Password terlalu lemah, gunakan kombinasi lebih panjang.'],
  ]
  for (const [re, msg] of map) {
    if (re.test(raw)) return msg
  }
  if (code === 429 || /429/.test(raw)) {
    return 'Terlalu banyak percobaan. Tunggu 10–60 menit lalu coba lagi.'
  }
  return raw || 'Autentikasi gagal. Coba lagi.'
}
