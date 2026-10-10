import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Loading from './components/Loading'

import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'

import Home from './pages/public/Home'
import SearchItems from './pages/public/SearchItems'
import ItemDetail from './pages/public/ItemDetail'

import LostReportForm from './pages/user/LostReportForm'
import FoundReportForm from './pages/user/FoundReportForm'
import MyReports from './pages/user/MyReports'
import LostDetail from './pages/user/LostDetail'
import ClaimForm from './pages/user/ClaimForm'
import ClaimDetail from './pages/user/ClaimDetail'
import Profile from './pages/user/Profile'
import Notifications from './pages/user/Notifications'

import OfficerDashboard from './pages/officer/OfficerDashboard'
import OfficerLostReports from './pages/officer/OfficerLostReports'
import OfficerFoundItems from './pages/officer/OfficerFoundItems'
import Matching from './pages/officer/Matching'
import Claims from './pages/officer/Claims'
import VerificationDetail from './pages/officer/VerificationDetail'
import Pickup from './pages/officer/Pickup'
import AuditTrail from './pages/officer/AuditTrail'

import ManageUsers from './pages/admin/ManageUsers'
import ManageCategories from './pages/admin/ManageCategories'

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!profile) return <Navigate to="/login" replace />
  // Semua role masuk ke beranda publik yang sama; officer/admin punya menu tambahan.
  return <Home />
}

function Guard({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER', 'ADMIN']}><RoleRedirect /></Guard>} />
          <Route path="/search" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><SearchItems /></Guard>} />
          <Route path="/items/:id" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><ItemDetail /></Guard>} />

          <Route path="/lapor-hilang" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><LostReportForm /></Guard>} />
          <Route path="/lapor-temu" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><FoundReportForm /></Guard>} />
          <Route path="/laporan-saya" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><MyReports /></Guard>} />
          <Route path="/laporan-saya/hilang/:id" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><LostDetail /></Guard>} />
          <Route path="/klaim/:id" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><ClaimForm /></Guard>} />
          <Route path="/klaim-detail/:id" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><ClaimDetail /></Guard>} />
          <Route path="/notifikasi" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER']}><Notifications /></Guard>} />
          <Route path="/profil" element={<Guard roles={['USER', 'LOST_FOUND_OFFICER', 'ADMIN']}><Profile /></Guard>} />

          <Route path="/officer" element={<Guard roles={['LOST_FOUND_OFFICER', 'ADMIN']}><OfficerDashboard /></Guard>} />
          <Route path="/officer/lost" element={<Guard roles={['LOST_FOUND_OFFICER']}><OfficerLostReports /></Guard>} />
          <Route path="/officer/found" element={<Guard roles={['LOST_FOUND_OFFICER']}><OfficerFoundItems /></Guard>} />
          <Route path="/officer/matching" element={<Guard roles={['LOST_FOUND_OFFICER']}><Matching /></Guard>} />
          <Route path="/officer/claims" element={<Guard roles={['LOST_FOUND_OFFICER']}><Claims /></Guard>} />
          <Route path="/officer/claims/:id" element={<Guard roles={['LOST_FOUND_OFFICER']}><VerificationDetail /></Guard>} />
          <Route path="/officer/pickup" element={<Guard roles={['LOST_FOUND_OFFICER']}><Pickup /></Guard>} />
          <Route path="/officer/audit" element={<Guard roles={['LOST_FOUND_OFFICER', 'ADMIN']}><AuditTrail /></Guard>} />

          <Route path="/admin/users" element={<Guard roles={['ADMIN']}><ManageUsers /></Guard>} />
          <Route path="/admin/categories" element={<Guard roles={['ADMIN']}><ManageCategories /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
