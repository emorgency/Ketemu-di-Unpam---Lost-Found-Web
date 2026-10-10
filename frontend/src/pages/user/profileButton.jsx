import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const ROLE_LABEL = { USER: 'Mahasiswa', LOST_FOUND_OFFICER: 'Petugas', ADMIN: 'Admin' }

export default function ProfileButton() {
  const { profile } = useAuth()

  if (!profile) return null

  // Ambil inisial dari nama (maks 2 huruf)
  const initials = (profile.nama || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Link
      to="/profile"
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50 transition"
      title={`${profile.nama} — ${ROLE_LABEL[profile.role] || profile.role}`}
    >
      {/* Avatar inisial */}
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {initials}
      </span>
      {/* Nama (sembunyikan di layar kecil) */}
      <span className="hidden text-sm font-medium text-gray-700 sm:block">
        {profile.nama?.split(' ')[0]}
      </span>
    </Link>
  )
}