import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/useAuth'
import { writeAudit } from '../../lib/api'
import { logger } from '../../lib/logger'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'
import { withDbHint } from '../../lib/api'

export default function ManageUsers() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  async function load() {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
    if (q) query = query.or(`nama.ilike.%${q}%,nim.ilike.%${q}%`)
    const { data, error: qErr } = await query
    if (qErr) setError(withDbHint('Gagal memuat pengguna: ' + qErr.message))
    else setRows(data || [])
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useRealtimeRefresh(['profiles'], load)

  async function setRole(id, role) {
    const old = rows.find((r) => r.id === id)
    if (id === profile.id && role !== 'ADMIN') {
      setError('Tidak dapat menurunkan role diri sendiri agar tidak terkunci.')
      return
    }
    setError('')
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) {
      setError(error.message)
      logger.error('ManageUsers', 'Gagal update role', { id })
    } else {
      await writeAudit(profile.id, 'USER', id, 'UPDATE_ROLE', { from: old?.role }, { to: role })
      load()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Kelola Pengguna</h1>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={(e) => { e.preventDefault(); load() }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama/NIM" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Cari</button>
      </form>
      <div className="overflow-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="p-3">Nama</th><th className="p-3">NIM</th><th className="p-3">Prodi/Semester</th><th className="p-3">No. Staff</th><th className="p-3">Role</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.nama}</td>
                <td className="p-3 font-mono text-xs">{r.nim}</td>
                <td className="p-3 text-xs">{r.prodi || '-'} {r.semester ? `(Smt ${r.semester})` : ''}</td>
                <td className="p-3 font-mono text-xs">{r.staff_no || '-'}</td>
                <td className="p-3 text-xs">{r.role}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {['USER', 'LOST_FOUND_OFFICER', 'ADMIN'].map((role) => (
                      <button key={role} disabled={r.role === role} onClick={() => setRole(r.id, role)} className="rounded border px-2 py-1 text-xs disabled:opacity-40">{role}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
