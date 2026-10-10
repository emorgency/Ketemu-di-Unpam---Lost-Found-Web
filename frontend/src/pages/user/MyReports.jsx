import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { myReports } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

function Row({ code, title, status, date, to }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl border p-3 hover:bg-gray-50">
      <div>
        <p className="text-sm font-semibold">{code} • {title}</p>
        <p className="text-xs text-gray-500">{new Date(date).toLocaleString('id-ID')}</p>
      </div>
      <StatusBadge status={status} />
    </Link>
  )
}

export default function MyReports() {
  const { profile } = useAuth()
  const location = useLocation()
  const [data, setData] = useState({ lost: [], found: [], claims: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('lost')

  useEffect(() => {
    myReports(profile.id).then(setData).catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])
  // Sinkron: status validasi/klaim dari petugas langsung terlihat.
  useRealtimeRefresh(
    ['items', 'lost_reports', 'found_reports', 'claims', 'notifications'],
    () => { myReports(profile.id).then(setData).catch(() => {}) }
  )

  if (loading) return <p className="text-sm text-gray-500">Memuat laporan...</p>

  return (
    <div className="space-y-4">
      <BackButton to="/" />
      <h1 className="text-xl font-bold">Laporan Saya</h1>
      {location.state?.created && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Laporan <b>{location.state.created}</b> berhasil dibuat. Pantau status dan timeline di halaman ini.
        </div>
      )}
      <div className="flex gap-2">
        {[['lost', `Kehilangan (${data.lost.length})`], ['found', `Penemuan (${data.found.length})`], ['claims', `Klaim (${data.claims.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === k ? 'bg-blue-600 text-white' : 'border'}`}>{label}</button>
        ))}
      </div>
      <div className="space-y-2">
        {tab === 'lost' && (data.lost.length === 0 ? <EmptyState title="Anda belum memiliki laporan" desc="Buat laporan kehilangan agar bisa dicocokkan." action={<Link to="/lapor-hilang" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Lapor Kehilangan</Link>} />
          : data.lost.map((r) => <Row key={r.id} code={r.report_code} title={r.items?.name} status={r.status} date={r.created_at} to={`/laporan-saya/hilang/${r.id}`} />))}
        {tab === 'found' && (data.found.length === 0 ? <EmptyState title="Belum ada laporan penemuan" /> : data.found.map((r) => <Row key={r.id} code={r.report_code} title={r.items?.name} status={r.status} date={r.created_at} to={`/search`} />))}
        {tab === 'claims' && (data.claims.length === 0 ? <EmptyState title="Belum ada klaim" /> : data.claims.map((c) => <Row key={c.id} code={c.claim_code} title={c.items?.name} status={c.status} date={c.created_at} to={`/klaim-detail/${c.id}`} />))}
      </div>
    </div>
  )
}
