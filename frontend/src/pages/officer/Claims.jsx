import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'
import { withDbHint } from '../../lib/api'

const FILTERS = [
  ['', 'Semua'],
  ['KLAIM_DIAJUKAN', 'Diajukan'],
  ['KLAIM_DIVERIFIKASI', 'Diverifikasi'],
  ['MENUNGGU_PENGAMBILAN', 'Siap diambil'],
  ['SELESAI', 'Selesai'],
  ['DITOLAK', 'Ditolak'],
]

export default function Claims() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    let q = supabase.from('claims').select('*, items(*), claimant:profiles!claims_claimant_id_fkey(nama,nim)').order('created_at', { ascending: false }).limit(50)
    if (filter) q = q.eq('status', filter)
    const { data, error: qErr } = await q
    if (qErr) setError(withDbHint('Gagal memuat klaim: ' + qErr.message))
    else setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [filter])
  // Sinkron: klaim baru dari mahasiswa langsung muncul.
  useRealtimeRefresh(['claims', 'items'], load)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Klaim &amp; Verifikasi</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-1.5 ${filter === v ? 'bg-blue-600 text-white' : 'border'}`}>{label}</button>
        ))}
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="text-sm text-gray-500">Memuat...</p> : rows.length === 0 ? <EmptyState title="Tidak ada klaim" /> : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="p-3">Kode</th><th className="p-3">Barang</th><th className="p-3">Pengklaim</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{c.claim_code}</td>
                  <td className="p-3">{c.items?.name}</td>
                  <td className="p-3 text-xs">********<br /><span className="text-gray-400">identitas termasking</span></td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3"><Link to={`/officer/claims/${c.id}`} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
