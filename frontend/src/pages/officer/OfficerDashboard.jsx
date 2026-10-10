import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardStats } from '../../lib/api'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardStats().then(setStats).catch((e) => setError(e.message))
  }, [])
  // Sinkron: angka ikut berubah saat ada laporan/klaim/pengambilan baru.
  useRealtimeRefresh(['items', 'lost_reports', 'found_reports', 'claims', 'audit_logs'],
    () => { dashboardStats().then(setStats).catch(() => {}) })

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!stats) return <p className="text-sm text-gray-500">Memuat dashboard...</p>

  const cards = [
    ['Total laporan hilang', stats.totalLost, '/officer/lost'],
    ['Barang ditemukan (siap klaim)', stats.totalFound, '/officer/found'],
    ['Klaim menunggu verifikasi', stats.pendingClaims, '/officer/claims'],
    ['Menunggu pengambilan', stats.pendingPickup, '/officer/pickup'],
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackButton to="/" />
      <h1 className="text-xl font-bold">Officer Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, v, to]) => (
          <Link key={label} to={to} className="rounded-xl border p-4 hover:bg-gray-50">
            <p className="text-3xl font-bold text-blue-700">{v}</p>
            <p className="mt-1 text-sm text-gray-600">{label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-semibold">Antrean operasional</h2>
          <ul className="space-y-1 text-sm">
            <li><Link to="/officer/lost?status=DILAPORKAN" className="text-blue-600">→ Laporan menunggu validasi</Link></li>
            <li><Link to="/officer/matching" className="text-blue-600">→ Antrean pencocokan</Link></li>
            <li><Link to="/officer/claims" className="text-blue-600">→ Klaim menunggu verifikasi</Link></li>
            <li><Link to="/officer/pickup" className="text-blue-600">→ Antrean pengambilan</Link></li>
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-semibold">Aktivitas terbaru</h2>
          {stats.recent.length === 0 ? <p className="text-sm text-gray-500">Belum ada aktivitas.</p> : (
            <ul className="space-y-1 text-xs text-gray-600">
              {stats.recent.map((r) => (
                <li key={r.id}>{new Date(r.created_at).toLocaleString('id-ID')} — {r.actor?.nama || '?'} ({r.actor?.role || '?'}{r.actor?.nim ? ` • ${r.actor.nim}` : ''}): {r.action} ({r.entity_type})</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
