import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { friendlyAuthError } from '../lib/authErrors'

export default function Login() {
  const [nim, setNim] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(nim.trim(), password)
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
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700">Lost &amp; Found Kampus</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk menggunakan NIM dan password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="lbl" htmlFor="nim">NIM / NIP / ID Pegawai</label>
            <input id="nim" type="text" value={nim} onChange={(e) => setNim(e.target.value)} placeholder="cth: 202101001" className="inp" required />
          </div>
          <div>
            <label className="lbl" htmlFor="pw">Password</label>
            <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" className="inp" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Belum punya akun? <Link to="/register" className="font-medium text-blue-600">Daftar</Link>
        </p>
      </div>
    </div>
  )
}
