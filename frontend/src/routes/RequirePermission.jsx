import { Navigate } from 'react-router-dom'
import { usePermissions } from '../features/roles/usePermissions'

export function RequirePermission({ permission, children }) {
  const { can } = usePermissions()

  if (!can(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
