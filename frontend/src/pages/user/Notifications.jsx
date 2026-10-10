import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { listNotifications, markNotificationRead } from '../../lib/api'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function Notifications() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setItems(await listNotifications(profile.id))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  // Sinkron: notifikasi baru langsung muncul.
  useRealtimeRefresh(['notifications'], load)

  async function mark(id) {
    await markNotificationRead(id)
    setItems((s) => s.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  }

  if (loading) return <p className="text-sm text-gray-500">Memuat notifikasi...</p>
  if (!items.length) return (
    <div className="space-y-2">
      <BackButton to="/" />
      <h1 className="text-xl font-bold">Notifikasi</h1>
      <EmptyState title="Tidak ada pemberitahuan baru" desc="Notifikasi validasi, kecocokan, klaim, dan pengambilan akan muncul di sini." />
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      <BackButton to="/" />
      <h1 className="text-xl font-bold">Notifikasi</h1>
      {items.map((n) => (
        <div key={n.id} className={`rounded-xl border p-3 ${n.read_at ? 'bg-white' : 'bg-blue-50/50'}`}>
          <p className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('id-ID')} • {n.type}</p>
          <p className="text-sm font-semibold">{n.title}</p>
          <p className="text-sm text-gray-600">{n.message}</p>
          {!n.read_at && <button onClick={() => mark(n.id)} className="mt-1 text-xs text-blue-600">Tandai dibaca</button>}
        </div>
      ))}
    </div>
  )
}
