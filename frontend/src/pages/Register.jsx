import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { friendlyAuthError } from '../lib/authErrors'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nim: '', nama: '', email: '', phone: '', semester: '', prodi: '', password: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!form.nim.trim() || !form.nama.trim() || !form.password) {
      setError('NIM, nama, dan password wajib diisi')
      return
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter (aturan Supabase Auth)')
      return
    }
    setLoading(true)
    try {
      const res = await signUp(form)
      if (res?.needsConfirmation) {
        setInfo('Akun dibuat. Konfirmasi email aktif di Supabase — matikan "Confirm email" di Authentication → Providers → Email agar bisa langsung login (email @campus.ac.id tidak menerima email).')
        return
      }
      navigate('/')
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-blue-700">Daftar Akun</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Akun kampus untuk lapor &amp; klaim barang</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {info && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{info}</div>}
          {[
            ['nim', 'NIM / NIP'],
            ['nama', 'Nama lengkap'],
            ['email', 'Email (opsional)'],
            ['phone', 'No. HP (opsional)'],
            ['semester', 'Semester (mahasiswa, opsional)'],
            ['prodi', 'Program studi (opsional)'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="lbl">{label}</label>
              <input value={form[k]} onChange={(e) => set(k, e.target.value)} className="inp" required={k === 'nim' || k === 'nama'} />
            </div>
          ))}
          <div>
            <label className="lbl">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="inp" required />
          </div>
          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500"><Link to="/login" className="text-blue-600">Kembali ke login</Link></p>
      </div>
    </div>
  )
}
