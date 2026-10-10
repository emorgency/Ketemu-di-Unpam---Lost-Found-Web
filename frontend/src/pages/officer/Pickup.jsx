import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { recordPickup } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function Pickup() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [form, setForm] = useState({ recipientNim: '', handoverNote: '' })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('claims').select('*, items(*)').in('status', ['KLAIM_DIVERIFIKASI', 'MENUNGGU_PENGAMBILAN']).order('created_at').limit(50)
    setRows(data || [])
    const { data: h } = await supabase.from('pickups').select('*, claims(claim_code)').order('created_at', { ascending: false }).limit(20)
    setHistory(h || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  // Sinkron: antrean pengambilan ter-update saat klaim disetujui.
  useRealtimeRefresh(['claims', 'pickups', 'items'], load)

  async function doPickup() {
    try {
      await recordPickup(profile.id, target.id, { ...form, recipientId: target.claimant_id })
      setTarget(null)
      setForm({ recipientNim: '', handoverNote: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Pengambilan</h1>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section>
        <h2 className="mb-2 text-sm font-semibold">Siap diambil (klaim disetujui)</h2>
        {loading ? <p className="text-sm text-gray-500">Memuat...</p> : rows.length === 0 ? <EmptyState title="Tidak ada antrean pengambilan" /> : (
          <div className="overflow-auto rounded-xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="p-3">Klaim</th><th className="p-3">Barang</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{c.claim_code}</td>
                    <td className="p-3">{c.items?.name}<br /><span className="text-xs text-gray-500">{c.items?.storage_location || '-'}</span></td>
                    <td className="p-3"><StatusBadge status={c.status} /></td>
                    <td className="p-3"><button onClick={() => setTarget(c)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Konfirmasi pengambilan</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold">Riwayat pengambilan</h2>
        <div className="space-y-1 text-sm">
          {history.map((p) => (
            <div key={p.id} className="rounded-lg border p-2 text-xs">{new Date(p.picked_up_at).toLocaleString('id-ID')} — {p.claims?.claim_code} — NIM ******** — {p.handover_note || '-'}</div>
          ))}
          {history.length === 0 && <p className="text-xs text-gray-500">Belum ada riwayat.</p>}
        </div>
      </section>
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-2 rounded-xl bg-white p-4">
            <h3 className="text-sm font-semibold">Konfirmasi pengambilan — {target.claim_code}</h3>
            <p className="text-xs text-gray-500">Verifikasi identitas penerima sebelum serah terima (BR-02).</p>
            <input value={form.recipientNim} onChange={(e) => setForm({ ...form, recipientNim: e.target.value })} placeholder="NIM / identitas penerima *" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input value={form.handoverNote} onChange={(e) => setForm({ ...form, handoverNote: e.target.value })} placeholder="Berita acara / catatan serah terima" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setTarget(null)} className="rounded-lg border px-3 py-1.5 text-sm">Batal</button>
              <button onClick={doPickup} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
