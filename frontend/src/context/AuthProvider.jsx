import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setLogUser } from '../lib/logger'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // maybeSingle (bukan single) agar profil yang belum ada tidak melempar 406.
  // Jika baris profil hilang (mis. trigger DB belum dipasang), buat ulang
  // dari metadata/metadata email — self-healing.
  const fetchProfile = useCallback(async (userId, sessionUser) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error('Gagal ambil profile:', error.message)
      setProfile(null)
      setLogUser(null)
    } else if (data) {
      setProfile(data)
      setLogUser(data.id)
    } else if (sessionUser) {
      const meta = sessionUser.user_metadata || {}
      const email = sessionUser.email || ''
      const nim = meta.nim || email.split('@')[0] || '-'
      const { data: created, error: cErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nim,
          nama: meta.nama || nim,
          email: meta.email || email,
          phone: meta.phone || null,
          semester: meta.semester || null,
          prodi: meta.prodi || null,
          staff_no: meta.staff_no || null,
          role: 'USER',
        }, { onConflict: 'id' })
        .select()
        .maybeSingle()
      if (cErr) {
        console.error('Gagal membuat ulang profile:', cErr.message)
        // Sesi basi: token tersimpan milik user yang sudah dihapus di server
        // (FK profiles_id_fkey = id tidak ada di auth.users) → paksa logout
        // agar user bisa daftar/masuk ulang dengan bersih.
        if (cErr.code === '23503') {
          await supabase.auth.signOut()
          setSession(null)
        }
        setProfile(null)
        setLogUser(null)
      } else {
        setProfile(created)
        setLogUser(created?.id || null)
      }
    } else {
      setProfile(null)
      setLogUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session) fetchProfile(session.user.id, session.user)
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      if (session) fetchProfile(session.user.id, session.user)
      else {
        setProfile(null)
        setLogUser(null)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile])

  async function signIn(nim, password) {
    const email = `${nim.trim()}@campus.ac.id`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp({ nim, nama, email, phone, semester, prodi, staffNo, password }) {
    const loginEmail = `${nim.trim()}@campus.ac.id`
    // Metadata dibaca oleh trigger DB handle_new_user() untuk membuat baris profiles.
    // Role selalu USER — peningkatan ke OFFICER/ADMIN hanya via dashboard oleh ADMIN.
    const { data, error } = await supabase.auth.signUp({
      email: loginEmail,
      password,
      options: {
        data: {
          nim: nim.trim(),
          nama: nama.trim(),
          email: email || loginEmail,
          phone: phone || null,
          semester: semester || null,
          prodi: prodi || null,
          staff_no: staffNo || null,
        },
      },
    })
    if (error) throw error
    if (!data.session) {
      // "Confirm email" aktif di dashboard → user harus konfirmasi dulu.
      // CATATAN: email login sintetis (@campus.ac.id) tidak bisa menerima
      // email, jadi untuk proyek ini "Confirm email" harus dimatikan.
      return { ...data, needsConfirmation: true }
    }
    // Fallback bila trigger DB belum dipasang — best effort, jangan gagalkan signup.
    const userId = data.user?.id
    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId, nim: nim.trim(), nama: nama.trim(),
        email: email || loginEmail, phone: phone || null,
        semester: semester || null, prodi: prodi || null, staff_no: staffNo || null,
        role: 'USER',
      }, { onConflict: 'id' }).then(({ error: pErr }) => {
        if (pErr) console.warn('Fallback profil gagal (trigger DB kemungkinan sudah menangani):', pErr.message)
      })
    }
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setLogUser(null)
  }

  async function refreshProfile() {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s) await fetchProfile(s.user.id, s.user)
  }

  const value = { session, profile, loading, signIn, signUp, signOut, refreshProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
