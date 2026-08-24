import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { AuthStartupState } from './AuthStartupState'

export function ProtectedRoute() {
  const { isChecking, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isChecking) {
    return (
      <AuthStartupState />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
