import { httpClient } from '../api/httpClient'
import { AUTH } from '../api/endpoints'

/**
 * Backend is expected to set an httpOnly session cookie on login — the
 * frontend never receives or stores the raw token.
 */
export const authService = {
  login: (credentials) => httpClient.post(AUTH.LOGIN, credentials),
  logout: () => httpClient.post(AUTH.LOGOUT),
  getCurrentUser: () => httpClient.get(AUTH.ME),
}
