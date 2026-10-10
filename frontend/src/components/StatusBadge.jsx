import { statusLabel } from '../lib/statuses'

const COLOR = {
  DILAPORKAN: 'bg-gray-100 text-gray-700',
  DIVERIFIKASI: 'bg-blue-50 text-blue-700',
  MENUNGGU_PENCOCOKAN: 'bg-blue-50 text-blue-700',
  DITEMUKAN: 'bg-blue-100 text-blue-800',
  MENUNGGU_VERIFIKASI_PEMILIK: 'bg-yellow-50 text-yellow-800',
  KLAIM_DIAJUKAN: 'bg-yellow-100 text-yellow-800',
  KLAIM_DIVERIFIKASI: 'bg-green-50 text-green-700',
  MENUNGGU_PENGAMBILAN: 'bg-yellow-100 text-yellow-800',
  SUDAH_DIAMBIL: 'bg-green-100 text-green-800',
  SELESAI: 'bg-green-100 text-green-800',
  DITOLAK: 'bg-red-50 text-red-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabel(status)}
    </span>
  )
}
