import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { Spinner } from '../components/Spinner/Spinner'

export function ProtectedRoute() {
  const { isChecking, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isChecking) {
    return (
      <div className="full-page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
