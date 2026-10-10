import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getItemDetail, listAuditLogs } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'
import { statusLabel } from '../../lib/statuses'
import BackButton from '../../components/BackButton'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getItemDetail(id).then(setItem).catch((e) => setError(e.message))
    listAuditLogs({ entityType: 'ITEM', entityId: id }).then(setLogs).catch(() => {})
    listAuditLogs({ entityType: 'CLAIM', entityId: id }).then(() => {}).catch(() => {})
  }, [id])

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!item) return <p className="text-sm text-gray-500">Memuat...</p>

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <BackButton to="/search" />
      <div className="grid gap-6 md:grid-cols-2">
      <div>
        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full rounded-xl border object-cover" /> : <div className="rounded-xl border bg-gray-50 p-10 text-center text-sm text-gray-400">Tidak ada foto</div>}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2"><h1 className="text-xl font-bold">{item.name}</h1><StatusBadge status={item.status} /></div>
        <p className="text-sm text-gray-500">{item.categories?.name}{item.color ? ` • ${item.color}` : ''}{item.brand ? ` • ${item.brand} ${item.model || ''}` : ''}</p>
        <dl className="space-y-1 text-sm">
          <div><dt className="font-medium">Ciri-ciri</dt><dd className="text-gray-700">{item.description}</dd></div>
          {item.ciri_khusus && <div><dt className="font-medium">Ciri khusus</dt><dd className="text-gray-700">{item.ciri_khusus}</dd></div>}
          {item.storage_location && <div><dt className="font-medium">Lokasi penyimpanan</dt><dd className="text-gray-700">{item.storage_location}</dd></div>}
          <div><dt className="font-medium">Status</dt><dd className="text-gray-700">{statusLabel(item.status)}</dd></div>
        </dl>
        <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">Pengajuan klaim tidak otomatis membuat barang dapat diambil. Petugas akan memverifikasi kepemilikan terlebih dahulu.</p>
        <div className="flex gap-2">
          <Link to={`/klaim/${item.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Ajukan Klaim</Link>
          <Link to="/search" className="rounded-lg border px-4 py-2 text-sm">Kembali</Link>
        </div>
        <div className="pt-4">
          <h2 className="mb-2 text-sm font-semibold">Timeline penanganan</h2>
          <StatusTimeline events={logs.map((l) => ({ at: l.created_at, title: `${l.action}`, desc: l.new_value ? JSON.stringify(l.new_value).slice(0, 140) : '', actor: l.actor?.nama }))} />
        </div>
      </div>
      </div>
    </div>
  )
}
