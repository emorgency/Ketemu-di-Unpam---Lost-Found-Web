import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { validateProfile } from '../../lib/validation'
import { logger } from '../../lib/logger'
import BackButton from '../../components/BackButton'


const ROLE_LABEL = { USER: 'Mahasiswa', LOST_FOUND_OFFICER: 'Petugas', ADMIN: 'Admin' }

// Profil milik sendiri: identitas wajib sesuai role, data pelengkap bisa diubah.
// USER (mahasiswa): nama, NIM, semester, prodi.
// LOST_FOUND_OFFICER / ADMIN: nama + no. validasi staff kampus.
export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const current = form || {
    nama: profile.nama || '',
    phone: profile.phone || '',
    semester: profile.semester || '',
    prodi: profile.prodi || '',
    staffNo: profile.staff_no || '',
  }
  function set(k, v) {
    setForm((f) => ({ ...(f || current), [k]: v }))
  }

  const isStaff = profile.role === 'LOST_FOUND_OFFICER' || profile.role === 'ADMIN'

  async function save(e) {
    e.preventDefault()
    const errs = validateProfile(current)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      const { error } = await supabase.from('profiles').update({
        nama: current.nama.trim(),
        phone: current.phone.trim() || null,
        semester: current.semester.trim() || null,
        prodi: current.prodi.trim() || null,
        staff_no: current.staffNo.trim() || null,
      }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setForm(null)
      setMsg({ type: 'ok', text: 'Profil berhasil diperbarui.' })
    } catch (err) {
      logger.error('Profile', 'Gagal simpan profil', { message: err.message })
      setMsg({ type: 'err', text: err.message || 'Gagal menyimpan profil.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="">
      <BackButton to="/" />
      <h1 className="page-title mt-3">Profil Saya</h1>
      <p className="page-sub">NIM dan role hanya dapat diubah oleh admin.</p>

      <div className="card mt-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900">{profile.nama}</p>
          <p className="font-mono text-xs text-gray-500">{profile.nim}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {ROLE_LABEL[profile.role] || profile.role}
        </span>
      </div>

      <form onSubmit={save} className="card mt-4 space-y-3">
        {msg.text && (
          <div className={`rounded-lg p-3 text-left text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="lbl">NIM</label><input value={profile.nim || ''} disabled className="inp bg-gray-50 text-gray-500" /></div>
          <div><label className="lbl">Role</label><input value={ROLE_LABEL[profile.role] || profile.role} disabled className="inp bg-gray-50 text-gray-500" /></div>
        </div>
        <div><label className="lbl">Nama lengkap *</label>
          <input value={current.nama} onChange={(e) => set('nama', e.target.value)} className="inp" />
          {errors.nama && <p className="err-text">{errors.nama}</p>}</div>
        <div><label className="lbl">No. HP</label>
          <input value={current.phone} onChange={(e) => set('phone', e.target.value)} placeholder="cth: 0812xxxx" className="inp" />
          {errors.phone && <p className="err-text">{errors.phone}</p>}</div>
        {!isStaff && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="lbl">Semester</label>
              <input value={current.semester} onChange={(e) => set('semester', e.target.value)} placeholder="cth: 3" inputMode="numeric" className="inp" />
              {errors.semester && <p className="err-text">{errors.semester}</p>}</div>
            <div><label className="lbl">Program studi</label>
              <input value={current.prodi} onChange={(e) => set('prodi', e.target.value)} placeholder="cth: Informatika" className="inp" />
              {errors.prodi && <p className="err-text">{errors.prodi}</p>}</div>
          </div>
        )}
        {isStaff && (
          <div><label className="lbl">No. validasi staff kampus</label>
            <input value={current.staffNo} onChange={(e) => set('staffNo', e.target.value)} placeholder="Nomor staff dari kampus" className="inp" />
            {errors.staffNo && <p className="err-text">{errors.staffNo}</p>}</div>
        )}
        <button disabled={saving} className="btn-primary w-full">{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
      </form>
    </div>
  )
}
