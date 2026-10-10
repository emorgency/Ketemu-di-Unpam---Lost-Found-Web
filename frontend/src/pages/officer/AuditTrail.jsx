import { useEffect, useState } from 'react'
import { listAuditLogs } from '../../lib/api'
import { statusLabel } from '../../lib/statuses'
import BackButton from '../../components/BackButton'
import EmptyState from '../../components/EmptyState'
import { useRealtimeRefresh } from '../../lib/realtime'

// Format kolom Perubahan agar rapi: "Dilaporkan → Diverifikasi • Alasan: ..."
function fmtChange(l) {
  const n = l.new_value || {}
  const bits = []
  if (n.from || n.to) bits.push(`${statusLabel(n.from || '?')} → ${statusLabel(n.to || '?')}`)
  if (n.reason) bits.push(`Alasan: ${n.reason}`)
  if (n.matchedItem) bits.push(`Cocok: ${String(n.matchedItem).slice(0, 8)}`)
  if (n.storageLocation) bits.push(`Simpan: ${n.storageLocation}`)
  if (n.code) bits.push(n.code)
  if (!bits.length) {
    const s = JSON.stringify(n)
    return s === '{}' || s === 'null' ? '—' : s.length > 60 ? s.slice(0, 60) + '…' : s
  }
  return bits.join(' • ')
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [entityType, setEntityType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setLogs(await listAuditLogs({ entityType: entityType || undefined, limit: 100 }))
    } catch (e) {
      setError('Gagal memuat riwayat: ' + (e.message || e))
    }
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [entityType])
  useRealtimeRefresh(['audit_logs'], load)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Riwayat Penanganan (Audit Trail)</h1>
      <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
        <option value="">Semua entitas</option>
        <option value="LOST_REPORT">Lost Report</option>
        <option value="FOUND_REPORT">Found Report</option>
        <option value="ITEM">Item</option>
        <option value="CLAIM">Claim</option>
        <option value="PICKUP">Pickup</option>
      </select>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="text-sm text-gray-500">Memuat...</p> : logs.length === 0 ? (
        <EmptyState title="Belum ada riwayat" desc="Aktivitas validasi, verifikasi, dan pengambilan yang tercatat akan muncul di sini." />
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Waktu</th><th className="p-3">Aktor</th><th className="p-3">Aksi</th><th className="p-3">Entitas</th><th className="p-3">Perubahan</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="whitespace-nowrap p-3">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                  <td className="p-3">{l.actor?.nama || '?'} ({l.actor?.role || '?'}{l.actor?.nim ? ` • ${l.actor.nim}` : ''})</td>
                  <td className="whitespace-nowrap p-3 font-medium">{l.action}</td>
                  <td className="whitespace-nowrap p-3">{l.entity_type} {String(l.entity_id).slice(0, 8)}</td>
                  <td className="p-3 text-gray-600">{fmtChange(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
