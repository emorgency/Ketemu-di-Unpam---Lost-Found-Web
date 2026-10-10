import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { searchFoundItems, myReports } from '../../lib/api'
import ItemCard from '../../components/ItemCard'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

import { useRealtimeRefresh } from '../../lib/realtime'

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [recent, setRecent] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadRecent(first = false) {
    if (first) setLoading(true)
    try {
      const r = await searchFoundItems({
        page: 1,
        pageSize: 6,
        statuses: ['DITEMUKAN', 'MENUNGGU_VERIFIKASI_PEMILIK'],
      })
      setRecent(r.data)
    } catch { /* abaikan, daftar terakhir tetap tampil */ }
    try {
      if (profile?.id) {
        const m = await myReports(profile.id)
        const all = [
          ...m.lost.map((x) => ({ ...x, kind: 'Hilang', code: x.report_code, name: x.items?.name, to: `/laporan-saya/hilang/${x.id}` })),
          ...m.found.map((x) => ({ ...x, kind: 'Temu', code: x.report_code, name: x.items?.name, to: '/laporan-saya' })),
          ...m.claims.map((x) => ({ ...x, kind: 'Klaim', code: x.claim_code, name: x.items?.name, to: `/klaim-detail/${x.id}` })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
        setMine(all)
      }
    } catch { /* abaikan */ }
    if (first) setLoading(false)
  }

  useEffect(() => { loadRecent(true) }, [])
  // Sinkron: beranda ikut ter-update saat ada laporan/temuan/klaim baru.
  useRealtimeRefresh(['items', 'lost_reports', 'found_reports', 'claims'], () => loadRecent(false))

  function goSearch(e) {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-2xl bg-blue-700 p-6 text-white md:p-10">
        <h1 className="text-2xl font-bold md:text-3xl">Kehilangan atau menemukan barang di kampus?</h1>
        <p className="mt-2 max-w-xl text-sm text-blue-100">
          Laporkan, cari, klaim, dan pantau status penanganan hingga pengambilan di meja Lost &amp; Found.
        </p>
        <form onSubmit={goSearch} className="mt-4 flex gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Cari: dompet hitam, kunci motor, laptop..."
            className="w-full rounded-lg px-3 py-2 text-sm text-gray-900" aria-label="Cari barang" />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700">Cari</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/lapor-hilang" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700">Lapor Kehilangan</Link>
          <Link to="/lapor-temu" className="rounded-lg border border-white/60 px-4 py-2 text-sm font-semibold text-white">Lapor Penemuan</Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Laporan terbaru saya</h2>
          <Link to="/laporan-saya" className="text-sm text-blue-600">Laporan Saya</Link>
        </div>
        {mine.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada laporan. Laporan yang baru dibuat langsung muncul di sini.</p>
        ) : (
          <div className="space-y-2">
            {mine.map((m) => (
              <Link key={m.kind + m.id} to={m.to} className="flex items-center justify-between rounded-xl border p-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold">{m.code} • {m.name} <span className="ml-1 text-xs font-normal text-gray-500">({m.kind})</span></p>
                  <p className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString('id-ID')}</p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Barang ditemukan terbaru</h2>
          <Link to="/search" className="text-sm text-blue-600">Lihat semua</Link>
        </div>
        {loading ? <p className="text-sm text-gray-500">Memuat...</p>
          : recent.length === 0 ? <EmptyState title="Belum ada barang ditemukan" desc="Coba ubah filter atau laporkan kehilangan Anda agar bisa dicocokkan petugas." action={<Link to="/lapor-hilang" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Lapor Kehilangan</Link>} />
          : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((it) => <ItemCard key={it.id} item={it} />)}</div>}
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <h3 className="font-semibold text-gray-900">Meja Lost &amp; Found • Gedung B Lt.1 • Senin–Sabtu 08.00–16.00</h3>
        <p>Bawa NIM/KTP saat pengambilan. Barang hanya diserahkan setelah klaim diverifikasi petugas.</p>
      </section>
    </div>
  )
}
