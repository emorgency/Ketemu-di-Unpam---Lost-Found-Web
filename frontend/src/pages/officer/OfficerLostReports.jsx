import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { validateLostReport, withDbHint } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { logger } from '../../lib/logger'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function OfficerLostReports() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [target, setTarget] = useState(null) // {id, approve}
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    let q = supabase.from('lost_reports').select('*, items(*, categories(name)), profiles!lost_reports_user_id_fkey(nama,nim)').order('created_at', { ascending: false }).limit(50)
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) setError(withDbHint(error.message))
    else setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [status])
  // Sinkron: laporan baru dari mahasiswa langsung masuk antrean.
  useRealtimeRefresh(['lost_reports', 'items'], load)

  async function doValidate() {
    try {
      await validateLostReport(profile.id, target.id, target.approve, reason)
      setTarget(null)
      setReason('')
      load()
    } catch (e) {
      setError(e.message)
      logger.error('OfficerLostReports', 'Validasi gagal', { message: e.message })
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Laporan Kehilangan</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ['', 'Semua'],
          ['DILAPORKAN', 'Dilaporkan'],
          ['MENUNGGU_PENCOCOKAN', 'Menunggu Pencocokan'],
          ['DITEMUKAN', 'Ditemukan'],
          ['DITOLAK', 'Ditolak'],
        ].map(([v, label]) => (
          <button key={v} onClick={() => setParams(v ? { status: v } : {})} className={`rounded-lg px-3 py-1.5 ${status === v ? 'bg-blue-600 text-white' : 'border'}`}>{label}</button>
        ))}
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="text-sm text-gray-500">Memuat...</p> : rows.length === 0 ? <EmptyState title="Tidak ada laporan" /> : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr><th className="p-3">Kode</th><th className="p-3">Barang</th><th className="p-3">Pelapor</th><th className="p-3">Lokasi/Waktu</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.report_code}</td>
                  <td className="p-3">{r.items?.name}<br /><span className="text-xs text-gray-500">{r.items?.categories?.name} • {r.items?.color}</span></td>
                  <td className="p-3 text-xs">{r.profiles?.nama}<br /><span className="text-gray-500">NIM: {r.profiles?.nim}</span></td>
                  <td className="p-3 text-xs">{r.lost_location}<br />{new Date(r.lost_at).toLocaleString('id-ID')}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">
                    {r.status === 'DILAPORKAN' ? (
                      <div className="flex gap-1">
                        <button onClick={() => setTarget({ id: r.id, approve: true })} className="rounded bg-green-600 px-2 py-1 text-xs text-white">Setujui</button>
                        <button onClick={() => setTarget({ id: r.id, approve: false })} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Tolak</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sudah diproses</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!!target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h3 className="text-sm font-semibold">{target.approve ? 'Setujui laporan?' : 'Tolak laporan?'}</h3>
            <p className="mt-1 text-sm text-gray-600">{target.approve ? 'Status menjadi DIVERIFIKASI → MENUNGGU_PENCOCOKAN.' : 'Penolakan wajib memiliki alasan (min 5 karakter) dan tercatat di audit.'}</p>
            {!target.approve && (
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" aria-label="Alasan penolakan" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setTarget(null); setReason('') }} className="rounded-lg border px-3 py-1.5 text-sm">Batal</button>
              <button onClick={doValidate} className={`rounded-lg px-3 py-1.5 text-sm text-white ${target.approve ? 'bg-green-600' : 'bg-red-600'}`}>
                {target.approve ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
