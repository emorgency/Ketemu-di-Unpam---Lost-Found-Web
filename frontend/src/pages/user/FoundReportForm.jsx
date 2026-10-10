import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { listCategories, createFoundReport } from '../../lib/api'
import { validateFoundReport, validateImageFile } from '../../lib/validation'
import ConfirmDialog from '../../components/ConfirmDialog'
import BackButton from '../../components/BackButton'

const EMPTY = { categoryId: '', name: '', description: '', ciriKhusus: '', color: '', brand: '', model: '', serialNumber: '', foundLocation: '', foundAt: '', note: '' }

export default function FoundReportForm() {
  const { profile } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successCode, setSuccessCode] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { listCategories().then(setCategories).catch(() => {}) }, [])
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function preSubmit(e) {
    e.preventDefault()
    const errs = validateFoundReport(form)
    const pm = validateImageFile(photo)
    if (pm) errs.photo = pm
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    setConfirm(true)
  }

  function resetForm() {
    setForm(EMPTY)
    setPhoto(null)
    setPreview(null)
    setErrors({})
    setSuccessCode('')
  }

  async function doSubmit() {
    setConfirm(false)
    setLoading(true)
    setSubmitError('')
    setSuccessCode('')
    try {
      const { report } = await createFoundReport(profile.id, form, photo)
      // Bukti terkirim: form dibersihkan + panel sukses dengan kode laporan.
      setForm(EMPTY)
      setPhoto(null)
      setPreview(null)
      setSuccessCode(report.report_code || '')
      window.scrollTo(0, 0)
    } catch (err) {
      setSubmitError(err.details ? 'Periksa kembali field yang bertanda.' : err.message)
      if (err.details) setErrors(err.details)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="">
      <BackButton to="/" />
      <h1 className="page-title mt-3">Lapor Penemuan</h1>
      <p className="mt-2 rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-800">Jika memungkinkan, serahkan barang ke meja Lost and Found untuk dicatat dan disimpan secara resmi.</p>
      {successCode && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4" role="status">
          <p className="text-sm font-semibold text-green-800">Laporan terkirim: {successCode}</p>
          <p className="mt-1 text-sm text-green-700">Terima kasih. Petugas akan memvalidasi laporan ini.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/laporan-saya" className="btn-primary">Lihat Laporan Saya</Link>
            <button onClick={resetForm} className="btn-ghost">Buat Laporan Lagi</button>
          </div>
        </div>
      )}
      <form onSubmit={preSubmit} className="card mt-4 space-y-3">
        {submitError && <div className="rounded-lg bg-red-50 p-3 text-left text-sm text-red-700">{submitError}</div>}
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="lbl">Kategori *</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="inp">
              <option value="">Pilih kategori</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>{errors.categoryId && <p className="err-text">{errors.categoryId}</p>}</div>
          <div><label className="lbl">Nama barang *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} className="inp" />{errors.name && <p className="err-text">{errors.name}</p>}</div>
        </div>
        <div><label className="lbl">Deskripsi *</label><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Warna, ukuran, isi, tanda khusus..."className="inp" />{errors.description && <p className="err-text">{errors.description}</p>}</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="lbl">Warna *</label><input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="cth: Hitam" className="inp" /></div>
          <div><label className="lbl">Merek</label><input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="inp" /></div>
          <div><label className="lbl">Model</label><input value={form.model} onChange={(e) => set('model', e.target.value)} className="inp" /></div>
          <div><label className="lbl">Lokasi ditemukan *</label><input value={form.foundLocation} onChange={(e) => set('foundLocation', e.target.value)} placeholder="cth: Gedung A Lt 2" className="inp" />{errors.foundLocation && <p className="err-text">{errors.foundLocation}</p>}</div>
          <div><label className="lbl">Waktu ditemukan *</label><input type="datetime-local" value={form.foundAt} onChange={(e) => set('foundAt', e.target.value)} className="inp" />{errors.foundAt && <p className="err-text">{errors.foundAt}</p>}</div>
        </div>
        <div><label className="lbl">Catatan tambahan</label><input value={form.note} onChange={(e) => set('note', e.target.value)} className="inp" /></div>
        <div><label className="lbl">Foto barang</label>
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setPhoto(f); setPreview(f ? URL.createObjectURL(f) : null) }} className="text-sm" />
          {errors.photo && <p className="err-text">{errors.photo}</p>}
          {preview && <img src={preview} alt="preview" className="mt-2 h-32 rounded-lg border object-cover" />}</div>
          <div className="text-xs text-red-500 font-">Kolom bertanda bintang (*) wajib diisi</div>
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Mengirim...' : 'Kirim Laporan Penemuan'}</button>
      </form>
      <ConfirmDialog open={confirm} title="Kirim laporan penemuan?" desc="Laporan masuk antrean validasi petugas." onCancel={() => setConfirm(false)} onConfirm={doSubmit} />
    </div>
  )
}
