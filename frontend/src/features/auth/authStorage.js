const ACCESS_TOKEN_KEY = 'yechim.auth.accessToken'
const REFRESH_TOKEN_KEY = 'yechim.auth.refreshToken'

// These keys belong to older/demo builds. Remove only those exact keys during
// migration; never clear localStorage wholesale because it is shared by tabs
// and may contain unrelated UI preferences.
const LEGACY_AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'authToken',
  'auth_token',
  'token',
  'user',
  'authUser',
  'currentUser',
  'session',
  'sessionId',
  'bold-yechim-demo-session-v1',
]

function getSessionStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function readAuthTokens() {
  const storage = getSessionStorage()
  if (!storage) return { accessToken: null, refreshToken: null }
  return {
    accessToken: storage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: storage.getItem(REFRESH_TOKEN_KEY),
  }
}

export function getAccessToken() {
  return readAuthTokens().accessToken
}

export function getRefreshToken() {
  return readAuthTokens().refreshToken
}

export function writeAuthTokens({ accessToken, refreshToken }) {
  const storage = getSessionStorage()
  if (!storage) return
  if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuthTokens() {
  const storage = getSessionStorage()
  if (!storage) return
  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName]
      LEGACY_AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
    } catch {
      // Storage can be unavailable in private browsing or restricted frames.
    }
  }
}
