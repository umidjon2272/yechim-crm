import { Navigate } from 'react-router-dom'
import { usePermissions } from '../features/roles/usePermissions'

export function RequirePermission({ permission, anyOf = [], children }) {
  const { can } = usePermissions()

  const allowed = anyOf.length > 0 ? anyOf.some((item) => can(item)) : can(permission)
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
