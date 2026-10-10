import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { validateFoundReport, receiveItem, withDbHint } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function OfficerFoundItems() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recv, setRecv] = useState(null)
  const [recvForm, setRecvForm] = useState({ condition: '', storageLocation: '', note: '' })
  const [reason, setReason] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('found_reports').select('*, items(*, categories(name))').order('created_at', { ascending: false }).limit(50)
    if (error) setError(withDbHint(error.message))
    else setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  // Sinkron: laporan penemuan baru langsung masuk.
  useRealtimeRefresh(['found_reports', 'items'], load)

  async function validate(id, approve) {
    try {
      await validateFoundReport(profile.id, id, approve, reason)
      setReason('')
      load()
    } catch (e) { setError(e.message) }
  }

  async function doReceive() {
    try {
      await receiveItem(profile.id, recv.id, recvForm)
      setRecv(null)
      setRecvForm({ condition: '', storageLocation: '', note: '' })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Barang Ditemukan &amp; Penerimaan</h1>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">Validasi → catat penerimaan fisik (waktu, petugas, kondisi, lokasi simpan) → status DITEMUKAN.</div>
      {loading ? <p className="text-sm text-gray-500">Memuat...</p> : rows.length === 0 ? <EmptyState title="Belum ada laporan penemuan" /> : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="p-3">Kode</th><th className="p-3">Barang</th><th className="p-3">Lokasi/Waktu</th><th className="p-3">Simpan</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.report_code}</td>
                  <td className="p-3">{r.items?.name}<br /><span className="text-xs text-gray-500">{r.found_location}</span></td>
                  <td className="p-3 text-xs">{new Date(r.found_at).toLocaleString('id-ID')}</td>
                  <td className="p-3 text-xs">{r.storage_location || '-'}<br />{r.received_at ? new Date(r.received_at).toLocaleString('id-ID') : ''}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {r.status === 'DILAPORKAN' && <>
                        <button onClick={() => validate(r.id, true)} className="rounded bg-green-600 px-2 py-1 text-xs text-white">Validasi</button>
                        <button onClick={() => { const rs = prompt('Alasan penolakan (min 5 karakter):'); if (rs !== null) { setReason(rs); validateFoundReport(profile.id, r.id, false, rs).then(load).catch((e) => setError(e.message)) } }} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Tolak</button>
                      </>}
                      <button onClick={() => setRecv(r)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Terima fisik</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-2 rounded-xl bg-white p-4">
            <h3 className="text-sm font-semibold">Penerimaan fisik — {recv.report_code}</h3>
            <input value={recvForm.storageLocation} onChange={(e) => setRecvForm({ ...recvForm, storageLocation: e.target.value })} placeholder="Lokasi penyimpanan *" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input value={recvForm.condition} onChange={(e) => setRecvForm({ ...recvForm, condition: e.target.value })} placeholder="Kondisi barang" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input value={recvForm.note} onChange={(e) => setRecvForm({ ...recvForm, note: e.target.value })} placeholder="Catatan" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRecv(null)} className="rounded-lg border px-3 py-1.5 text-sm">Batal</button>
              <button onClick={doReceive} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
