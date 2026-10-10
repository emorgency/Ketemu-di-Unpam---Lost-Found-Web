import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Akses Ditolak</h1>
      <p className="mt-2 text-gray-500">Kamu tidak punya izin membuka halaman ini.</p>
      <Link to="/" className="mt-4 text-blue-600 hover:underline">
        Kembali ke dashboard
      </Link>
    </div>
  )
}