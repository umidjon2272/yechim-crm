import { httpClient } from '../api/httpClient'
import { AUTH } from '../api/endpoints'

// Auth tokens are returned by the backend and persisted by AuthContext in the
// current tab's sessionStorage. This service only transports them.
export const authService = {
  login: (credentials) => httpClient.post(AUTH.LOGIN, credentials, { skipAuth: true, skipRefresh: true }),
  logout: (tokens = {}) =>
    httpClient.post(
      AUTH.LOGOUT,
      { refreshToken: tokens.refreshToken },
      { accessToken: tokens.accessToken || null, skipAuth: !tokens.accessToken, skipRefresh: true },
    ),
  getCurrentUser: () => httpClient.get(AUTH.ME),
}
