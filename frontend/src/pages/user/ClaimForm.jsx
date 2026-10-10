import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getItemDetail, createClaim, myReports, listCategories } from '../../lib/api'
import { validateClaim, validateEvidenceFile } from '../../lib/validation'
import BackButton from '../../components/BackButton'

export default function ClaimForm() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({ hubungan: '', detailKhusus: '', catatan: '', lostReportId: '' })
  const [lostOptions, setLostOptions] = useState([])
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getItemDetail(id).then(setItem).catch((e) => setError(e.message))
    myReports(profile.id).then((d) => setLostOptions(d.lost)).catch(() => {})
    listCategories().catch(() => {})
  }, [id, profile.id])

  async function submit(e) {
    e.preventDefault()
    const errs = validateClaim(form)
    const fm = validateEvidenceFile(file)
    if (fm) errs.file = fm
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    setLoading(true)
    setError('')
    try {
      const claim = await createClaim(profile.id, id, form, file)
      navigate(`/klaim-detail/${claim.id}`)
    } catch (err) {
      setError(err.details ? 'Periksa kembali isian.' : err.message)
      if (err.details) setErrors(err.details)
    } finally {
      setLoading(false)
    }
  }

  if (error && !item) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!item) return <p className="text-sm text-gray-500">Memuat...</p>

  const input = 'inp'
  return (
    <div className="mx-auto max-w-xl">
      <BackButton to={`/items/${id}`} />
      <h1 className="mt-3 text-left text-xl font-bold">Ajukan Klaim</h1>
      <p className="text-left text-sm text-gray-500">Barang: <b>{item.name}</b></p>
      <p className="mt-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">Pengajuan klaim tidak otomatis membuat barang dapat diambil. Petugas Lost and Found akan melakukan verifikasi kepemilikan.</p>
      <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border p-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div><label className="lbl">Kaitkan laporan kehilangan (opsional)</label>
          <select value={form.lostReportId} onChange={(e) => setForm({ ...form, lostReportId: e.target.value })} className={input}>
            <option value="">— tanpa laporan —</option>
            {lostOptions.map((l) => <option key={l.id} value={l.id}>{l.report_code} • {l.items?.name}</option>)}
          </select></div>
        <div><label className="lbl">Hubungan dengan barang *</label>
          <input value={form.hubungan} onChange={(e) => setForm({ ...form, hubungan: e.target.value })} placeholder="cth: Pemilik / dipinjam teman" className={input} />
          {errors.hubungan && <p className="text-xs text-red-600">{errors.hubungan}</p>}</div>
        <div><label className="lbl">Detail yang hanya diketahui pemilik *</label>
          <textarea value={form.detailKhusus} onChange={(e) => setForm({ ...form, detailKhusus: e.target.value })} rows={3} placeholder="Isi dompet, goresan khusus, wallpaper HP, dll." className={input} />
          {errors.detailKhusus && <p className="text-xs text-red-600">{errors.detailKhusus}</p>}</div>
        <div><label className="lbl">Bukti kepemilikan (foto/struk/PDF)</label>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          {errors.file && <p className="text-xs text-red-600">{errors.file}</p>}
          <p className="text-xs text-gray-500">Disimpan privat, hanya petugas berwenang yang dapat membuka.</p></div>
        <div><label className="lbl">Catatan tambahan</label><input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className={input} /></div>
        <div className="flex gap-2">
          <button disabled={loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Mengirim...' : 'Kirim Klaim'}</button>
          <Link to={`/items/${id}`} className="rounded-lg border px-4 py-2 text-sm">Batal</Link>
        </div>
      </form>
    </div>
  )
}
