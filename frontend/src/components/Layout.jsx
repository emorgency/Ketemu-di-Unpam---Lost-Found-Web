import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LogOut, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROLE_LABEL = { USER: 'Mahasiswa', LOST_FOUND_OFFICER: 'Petugas', ADMIN: 'Admin' }

const menus = {
  USER: [
    { to: '/', label: 'Beranda' },
    { to: '/search', label: 'Cari Barang' },
    { to: '/lapor-hilang', label: 'Lapor Kehilangan' },
    { to: '/lapor-temu', label: 'Lapor Penemuan' },
    { to: '/laporan-saya', label: 'Laporan Saya' },
  ],
  LOST_FOUND_OFFICER: [
    { to: '/officer', label: 'Overview' },
    { to: '/officer/lost', label: 'Laporan Kehilangan' },
    { to: '/officer/found', label: 'Barang Ditemukan' },
    { to: '/officer/matching', label: 'Pencocokan' },
    { to: '/officer/claims', label: 'Klaim & Verifikasi' },
    { to: '/officer/pickup', label: 'Pengambilan' },
    { to: '/officer/audit', label: 'Riwayat' },
    { to: '/search', label: 'Cari Barang' },
  ],
  ADMIN: [
    { to: '/officer', label: 'Overview' },
    { to: '/officer/audit', label: 'Riwayat Interaksi' },
    { to: '/admin/users', label: 'Pengguna' },
    { to: '/admin/categories', label: 'Kategori' },
  ],
}

/** Tombol profil: avatar inisial + nama depan, klik → /profil */
function ProfileButton({ profile }) {
  if (!profile) return null
  const initials = (profile.nama || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Link
      to="/profil"
      title={`${profile.nama} — ${ROLE_LABEL[profile.role] || profile.role}`}
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-1.5 py-1 transition hover:bg-gray-50"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
        {initials}
      </span>
      <span className="hidden pr-1 text-xs font-medium text-gray-700 sm:block">
        {profile.nama?.split(' ')[0]}
      </span>
    </Link>
  )
}

/** Tombol notifikasi: ikon lonceng + badge unread, klik → /notifikasi */
function NotificationsButton({ unread }) {
  return (
    <Link
      to="/notifikasi"
      aria-label="Notifikasi"
      className="relative rounded-lg border border-gray-200 bg-white p-2 transition hover:bg-gray-50"
    >
      <Bell size={16} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-[10px] text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id)
      .is('read_at', null)
      .then(({ count }) => setUnread(count ?? 0))
      .catch(() => {})
  }, [profile, location.pathname])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const roleMenus = menus[profile?.role] || menus.USER

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ============ SIDEBAR (desktop) ============ */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-100 p-6">
          <h1 className="text-lg font-bold text-blue-700">Ketemu di Unpam</h1>
          <p className="mt-1 truncate text-xs text-gray-500">
            {profile?.nama} • {profile?.nim}
          </p>
          <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {ROLE_LABEL[profile?.role] || profile?.role}
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto p-3">
          {roleMenus.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
                {item.to === '/notifikasi' && unread > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ============ MAIN AREA ============ */}
      <div className="md:ml-64">
        {/* ===== HEADER: Notifikasi + Profil berdampingan ===== */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <Link to="/" className="font-bold text-blue-700 md:hidden">
            Ketemu di Unpam
          </Link>
          <p className="hidden text-xs text-gray-500 md:block"></p>

          <div className="flex items-center gap-2">
            <NotificationsButton unread={unread} />
            <ProfileButton profile={profile} />
            <button
              onClick={handleLogout}
              className="rounded-lg border px-3 py-1.5 text-xs md:hidden"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <main className="p-4 pb-24 md:p-8 md:pb-8">{children}</main>

        {/* ===== BOTTOM NAV (mobile) ===== */}
        <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-gray-200 bg-white px-2 py-2 md:hidden">
          {roleMenus.slice(0, 5).map((m) => (
            <Link
              key={m.to + m.label}
              to={m.to}
              className={`rounded-lg px-2 py-1.5 text-xs ${
                location.pathname === m.to ? 'font-semibold text-blue-700' : 'text-gray-600'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}