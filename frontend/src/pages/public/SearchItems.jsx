import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchFoundItems, listCategories } from '../../lib/api'
import ItemCard from '../../components/ItemCard'
import EmptyState from '../../components/EmptyState'
import BackButton from '../../components/BackButton'
import { useRealtimeRefresh } from '../../lib/realtime'

export default function SearchItems() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({
    q: params.get('q') || '', categoryId: '', color: '', location: '', status: '',
    fromDate: '', toDate: '',
  })

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
  }, [])

  async function run(page = 1, override) {
    const ff = override || f
    setLoading(true)
    setError('')
    try {
      const r = await searchFoundItems({
        keyword: ff.q || undefined, categoryId: ff.categoryId || undefined,
        color: ff.color || undefined, location: ff.location || undefined,
        status: ff.status || undefined,
        from: ff.fromDate ? new Date(ff.fromDate + 'T00:00:00').toISOString() : undefined,
        to: ff.toDate ? new Date(ff.toDate + 'T23:59:59').toISOString() : undefined,
        page, pageSize: 12,
      })
      setItems(r.data)
      setTotal(r.total)
    } catch (e) {
      setError('Pencarian gagal: ' + (e.message || e))
    } finally {
      setLoading(false)
    }
  }

  function clearFilter() {
    const empty = { q: '', categoryId: '', color: '', location: '', status: '', fromDate: '', toDate: '' }
    setF(empty)
    setParams({})
    run(1, empty)
  }

  useEffect(() => { run(1); /* eslint-disable-next-line */ }, [])
  // Sinkron: hasil ikut berubah saat status barang berubah (mis. diklaim).
  useRealtimeRefresh(['items'], () => run(1))

  function set(k, v) {
    setF((s) => ({ ...s, [k]: v }))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <BackButton to="/" />
      <h1 className="text-xl font-bold">Cari Barang Ditemukan</h1>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={(e) => { e.preventDefault(); setParams(f.q ? { q: f.q } : {}); run(1) }} className="grid grid-cols-1 gap-2 rounded-xl border p-4 md:grid-cols-6">
        <input value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Kata kunci" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" aria-label="Kata kunci" />
        <select value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="rounded-lg border px-3 py-2 text-sm" aria-label="Kategori">
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={f.color} onChange={(e) => set('color', e.target.value)} placeholder="Warna" className="rounded-lg border px-3 py-2 text-sm" aria-label="Warna" />
        <input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Lokasi" className="rounded-lg border px-3 py-2 text-sm" aria-label="Lokasi" />
        <select value={f.status} onChange={(e) => set('status', e.target.value)} className="rounded-lg border px-3 py-2 text-sm" aria-label="Status">
          <option value="">Semua status</option>
          <option value="DITEMUKAN">Ditemukan</option>
          <option value="MENUNGGU_PENCOCOKAN">Menunggu Pencocokan</option>
          <option value="KLAIM_DIAJUKAN">Diklaim</option>
          <option value="MENUNGGU_PENGAMBILAN">Siap diambil</option>
        </select>
        <input type="date" value={f.fromDate} onChange={(e) => set('fromDate', e.target.value)} className="rounded-lg border px-3 py-2 text-sm" aria-label="Dari tanggal" />
        <input type="date" value={f.toDate} onChange={(e) => set('toDate', e.target.value)} className="rounded-lg border px-3 py-2 text-sm" aria-label="Sampai tanggal" />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white md:col-span-4">Terapkan Filter</button>
        <button type="button" onClick={clearFilter} className="rounded-lg border px-4 py-2 text-sm md:col-span-2">Hapus Filter</button>
      </form>

      <p className="text-xs text-gray-500">{total} hasil. Data publik — bukti kepemilikan &amp; identitas pemilik disembunyikan.</p>
      {loading ? <p className="text-sm text-gray-500">Mencari...</p>
        : items.length === 0 ? <EmptyState title="Belum ada barang yang sesuai" desc="Ubah filter atau buat laporan kehilangan agar petugas bisa mencocokkan." />
        : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((it) => <ItemCard key={it.id} item={it} />)}</div>}
    </div>
  )
}
