import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getClaim, verifyClaim } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { maskNim } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import BackButton from '../../components/BackButton'

export default function VerificationDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [error, setError] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState(null)
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(null) // 'approve' | 'reject'

  useEffect(() => {
    getClaim(id).then(setClaim).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    async function run() {
      const ref = claim?.verifications?.[0]?.evidence_ref || claim?.verifications?.evidence_ref
      if (!ref) return
      const { data } = await supabase.storage.from('evidence').createSignedUrl(ref, 300)
      if (data?.signedUrl) setEvidenceUrl(data.signedUrl)
    }
    run()
  }, [claim])

  async function doVerify() {
    try {
      await verifyClaim(profile.id, id, confirm === 'approve', reason, notes)
      navigate('/officer/claims')
    } catch (e) {
      setError(e.message)
    } finally {
      setConfirm(null)
    }
  }

  if (error && !claim) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!claim) return <p className="text-sm text-gray-500">Memuat...</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton to="/officer/claims" />
      <div className="flex items-center gap-2"><h1 className="text-xl font-bold">Klaim {claim.claim_code}</h1><StatusBadge status={claim.status} /></div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border p-4 text-sm">
        <p><b>Barang:</b> {claim.items?.name} ({claim.items?.status})</p>
        <p><b>Pelapor:</b> ********</p>
        <p><b>NIM:</b> {maskNim(claim.claimant?.nim)} (termasking, verifikasi identitas saat pengambilan)</p>
        {(claim.claimant?.prodi || claim.claimant?.semester) && (
          <p><b>Prodi/Semester:</b> {claim.claimant?.prodi || '-'}{claim.claimant?.semester ? ` (Smt ${claim.claimant.semester})` : ''}</p>
        )}
        <p className="mt-2"><b>Hubungan:</b> {claim.hubungan}</p>
        <p><b>Detail khusus:</b> {claim.detail_khusus}</p>
        {claim.catatan && <p><b>Catatan:</b> {claim.catatan}</p>}
        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <p className="font-medium">Bukti kepemilikan (privat, authorized)</p>
          {evidenceUrl ? <a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Buka bukti (tautan 5 menit)</a> : <p className="text-gray-500">Tidak ada file / hanya deskripsi.</p>}
          {claim.verifications?.[0]?.evidence_meta && <p className="mt-1 text-xs text-gray-500">Meta: {JSON.stringify(claim.verifications[0].evidence_meta)}</p>}
        </div>
      </div>
      {claim.status === 'KLAIM_DIAJUKAN' && (
        <div className="space-y-2 rounded-xl border p-4">
          <label className="text-sm font-medium">Catatan verifikasi</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan internal" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <label className="text-sm font-medium">Alasan penolakan (wajib jika menolak)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: detail tidak cocok dengan barang" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => setConfirm('approve')} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">Setujui</button>
            <button onClick={() => setConfirm('reject')} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Tolak</button>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!confirm} title={confirm === 'approve' ? 'Setujui klaim?' : 'Tolak klaim?'}
        desc={confirm === 'approve' ? 'Barang menjadi MENUNGGU_PENGAMBILAN dan pemilik menerima notifikasi.' : 'Penolakan wajib memiliki alasan dan tercatat di audit.'}
        danger={confirm === 'reject'} onCancel={() => setConfirm(null)} onConfirm={doVerify} />
    </div>
  )
}
