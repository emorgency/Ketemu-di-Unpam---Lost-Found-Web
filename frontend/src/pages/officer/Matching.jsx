import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { findCandidates, confirmMatch } from '../../lib/api'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function Matching() {
  const { profile } = useAuth()
  const [lostList, setLostList] = useState([])
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('lost_reports').select('*, items(*)').in('status', ['DILAPORKAN', 'DIVERIFIKASI', 'MENUNGGU_PENCOCOKAN']).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setLostList(data || []))
  }, [])
  // Sinkron: laporan baru otomatis masuk daftar pilihan.
  useRealtimeRefresh(['lost_reports'], () => {
    supabase.from('lost_reports').select('*, items(*)').in('status', ['DILAPORKAN', 'DIVERIFIKASI', 'MENUNGGU_PENCOCOKAN']).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setLostList(data || []))
  })

  async function run() {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      setResult(await findCandidates(selected))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function confirm(itemId) {
    if (!confirmWindow('Konfirmasi kecocokan? Keputusan ini dicatat di audit.')) return
    try {
      await confirmMatch(profile.id, selected, itemId)
      alert('Kecocokan dikonfirmasi. Pelapor menerima notifikasi.')
      run()
    } catch (e) {
      setError(e.message)
    }
  }

  function confirmWindow(msg) {
    return window.confirm(msg)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Pencocokan</h1>
      <p className="text-sm text-gray-500">Skor hanya rekomendasi. Keputusan akhir oleh petugas dan tercatat di audit.</p>
      <div className="flex gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="">Pilih laporan kehilangan</option>
          {lostList.map((l) => <option key={l.id} value={l.id}>{l.report_code} • {l.items?.name} • {l.lost_location}</option>)}
        </select>
        <button onClick={run} disabled={!selected || loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">Cari kandidat</button>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <p className="text-sm text-gray-500">Menghitung skor...</p>}
      {result && (
        <div className="space-y-2">
          {result.candidates.length === 0 && <p className="text-sm text-gray-500">Tidak ada kandidat.</p>}
          {result.candidates.slice(0, 20).map(({ item, score, parts }) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold">{item.name} <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs">skor {score}</span></p>
                <p className="text-xs text-gray-500">{item.categories?.name} • {item.color} • {item.storage_location || '-'} • kat:{parts.category} nama:{parts.name} brand:{parts.brandModel} warna:{parts.color} lok:{parts.location} waktu:{parts.time}</p>
              </div>
              <button onClick={() => confirm(item.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white">Konfirmasi cocok</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
