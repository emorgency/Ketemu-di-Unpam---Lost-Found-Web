import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Loading from './Loading'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Loading />
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}