import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { listAuditLogs } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'
import BackButton from '../../components/BackButton'

export default function LostDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    supabase.from('lost_reports').select('*, items(*, categories(name))').eq('id', id).single()
      .then(({ data }) => setReport(data))
    listAuditLogs({ entityType: 'LOST_REPORT', entityId: id }).then(setLogs).catch(() => {})
  }, [id])

  if (!report) return <p className="text-sm text-gray-500">Memuat...</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton to="/laporan-saya" />
      <div className="flex items-center gap-2"><h1 className="text-xl font-bold">{report.report_code}</h1><StatusBadge status={report.status} /></div>
      <div className="rounded-xl border p-4 text-sm">
        <p><b>Barang:</b> {report.items?.name} ({report.items?.categories?.name})</p>
        <p><b>Lokasi hilang:</b> {report.lost_location}</p>
        <p><b>Waktu:</b> {new Date(report.lost_at).toLocaleString('id-ID')}</p>
        <p><b>Deskripsi:</b> {report.description}</p>
        {report.rejection_reason && <p className="mt-2 rounded bg-red-50 p-2 text-red-700"><b>Alasan penolakan:</b> {report.rejection_reason}</p>}
      </div>
      <div><h2 className="mb-2 text-sm font-semibold">Timeline penanganan</h2>
        <StatusTimeline events={logs.map((l) => ({ at: l.created_at, title: l.action, desc: JSON.stringify(l.new_value || {}).slice(0, 140), actor: l.actor?.nama }))} />
      </div>
      <Link to="/laporan-saya" className="inline-block rounded-lg border px-4 py-2 text-sm">Kembali</Link>
    </div>
  )
}
