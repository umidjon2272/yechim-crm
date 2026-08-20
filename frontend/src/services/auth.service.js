import { httpClient } from '../api/httpClient'
import { AUTH } from '../api/endpoints'

// Auth tokens are returned by the backend and persisted by AuthContext. This
// service only transports them; the current user is always resolved by /me.
export const authService = {
  login: (credentials) => httpClient.post(AUTH.LOGIN, credentials, { skipAuth: true, skipRefresh: true }),
  logout: (tokens = {}) =>
    httpClient.post(
      AUTH.LOGOUT,
      { refreshToken: tokens.refreshToken },
      { accessToken: tokens.accessToken || null, skipAuth: !tokens.accessToken, skipRefresh: true },
    ),
  getCurrentUser: () => httpClient.get(AUTH.ME),
  changePassword: (payload) => httpClient.post('/auth/change-password', payload),
}
