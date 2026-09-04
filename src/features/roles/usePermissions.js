import { useAuth } from '../auth/useAuth'
import { can as canCheck } from './permissions'

export function usePermissions() {
  const { user } = useAuth()

  return {
    can: (permissionKey) => canCheck(user, permissionKey),
  }
}
