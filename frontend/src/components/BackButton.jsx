import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Tombol kembali konsisten di semua halaman konten.
// Kembali ke halaman sebelumnya bila ada riwayat, else ke rute fallback.
export default function BackButton({ to = '/', label = 'Kembali' }) {
  const navigate = useNavigate()

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate(to)
  }

  return (
    <button
      onClick={goBack}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-sm text-gray-700 hover:bg-gray-50"
      aria-label={label}
    >
      <ArrowLeft size={12} />
      {label}
    </button>
  )
}
