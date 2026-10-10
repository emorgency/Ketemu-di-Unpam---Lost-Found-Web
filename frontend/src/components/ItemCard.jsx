import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function fmtDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ItemCard({ item }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gray-50 text-sm text-gray-400">Tidak ada foto</div>
      )}
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-xs text-gray-500">
          {item.categories?.name || 'Tanpa kategori'}{item.color ? ` • ${item.color}` : ''}
        </p>
        <p className="text-xs text-gray-500">
          {item.storage_location ? `Lokasi: ${item.storage_location}` : ''} • {fmtDate(item.created_at)}
        </p>
        <Link to={`/items/${item.id}`} className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          Lihat & Ajukan Klaim
        </Link>
      </div>
    </div>
  )
}
