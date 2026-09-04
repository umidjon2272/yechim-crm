import { usePermissions } from './usePermissions'

/**
 * UI guard only — hides children when the current user lacks the permission.
 * Real authorization must still happen on the backend.
 */
export function PermissionGate({ permission, fallback = null, children }) {
  const { can } = usePermissions()
  if (!permission) return children
  return can(permission) ? children : fallback
}
