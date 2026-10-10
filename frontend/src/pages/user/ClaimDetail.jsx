import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClaim, listAuditLogs } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'
import BackButton from '../../components/BackButton'

export default function ClaimDetail() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState(null)

  useEffect(() => {
    getClaim(id).then(setClaim).catch((e) => setError(e.message))
    listAuditLogs({ entityType: 'CLAIM', entityId: id }).then(setLogs).catch(() => {})
  }, [id])

  useEffect(() => {
    async function loadEvidence() {
      const ref = claim?.verifications?.[0]?.evidence_ref || claim?.verifications?.evidence_ref
      if (!ref) return
      const { data } = await supabase.storage.from('evidence').createSignedUrl(ref, 300)
      if (data?.signedUrl) setEvidenceUrl(data.signedUrl)
    }
    loadEvidence()
  }, [claim])

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!claim) return <p className="text-sm text-gray-500">Memuat...</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton to="/laporan-saya" />
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Klaim {claim.claim_code}</h1>
        <StatusBadge status={claim.status} />
      </div>
      <div className="rounded-xl border p-4 text-sm">
        <p><b>Barang:</b> {claim.items?.name}</p>
        <p><b>Hubungan:</b> {claim.hubungan}</p>
        <p><b>Detail khusus:</b> {claim.detail_khusus}</p>
        {claim.catatan && <p><b>Catatan:</b> {claim.catatan}</p>}
        {claim.status === 'DITOLAK' && <p className="mt-2 rounded-lg bg-red-50 p-2 text-red-700"><b>Alasan penolakan:</b> {claim.rejection_reason}</p>}
        {evidenceUrl && <p className="mt-2"><a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Lihat bukti saya (tautan privat 5 menit)</a></p>}
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
        <StatusTimeline events={logs.map((l) => ({ at: l.created_at, title: l.action, desc: JSON.stringify(l.new_value || {}).slice(0, 140), actor: l.actor?.nama }))} />
      </div>
      <Link to="/laporan-saya" className="inline-block rounded-lg border px-4 py-2 text-sm">Kembali</Link>
    </div>
  )
}
