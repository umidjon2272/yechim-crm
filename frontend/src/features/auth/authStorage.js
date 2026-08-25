const ACCESS_TOKEN_KEY = 'yechim.auth.accessToken'
const REFRESH_TOKEN_KEY = 'yechim.auth.refreshToken'

export const AUTH_STORAGE_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]

// These keys belong to older/demo builds. Remove only those exact keys during
// migration; never clear localStorage wholesale because it may contain
// unrelated UI preferences.
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

function getStorage(name) {
  if (typeof window === 'undefined') return null
  try {
    return window[name]
  } catch {
    return null
  }
}

function getPersistentStorage() {
  return getStorage('localStorage')
}

function getSessionStorage() {
  return getStorage('sessionStorage')
}

export function readAuthTokens() {
  const persistentStorage = getPersistentStorage()
  const sessionStorage = getSessionStorage()
  const persistentAccessToken = persistentStorage?.getItem(ACCESS_TOKEN_KEY) || null
  const persistentRefreshToken = persistentStorage?.getItem(REFRESH_TOKEN_KEY) || null
  const sessionAccessToken = sessionStorage?.getItem(ACCESS_TOKEN_KEY) || null
  const sessionRefreshToken = sessionStorage?.getItem(REFRESH_TOKEN_KEY) || null

  // During the migration from tab-scoped sessionStorage to persistent PWA
  // storage, the two token keys can briefly be split across storages (for
  // example after an interrupted write). Keep the pair together so an old
  // access token cannot hide a still-valid refresh token.
  const accessToken = persistentAccessToken || sessionAccessToken
  const refreshToken = persistentRefreshToken || sessionRefreshToken
  if (persistentStorage && (sessionAccessToken || sessionRefreshToken)) {
    if (!persistentAccessToken && sessionAccessToken) persistentStorage.setItem(ACCESS_TOKEN_KEY, sessionAccessToken)
    if (!persistentRefreshToken && sessionRefreshToken) persistentStorage.setItem(REFRESH_TOKEN_KEY, sessionRefreshToken)
  }

  return { accessToken, refreshToken }
}

export function getAccessToken() {
  return readAuthTokens().accessToken
}

export function getRefreshToken() {
  return readAuthTokens().refreshToken
}

export function writeAuthTokens({ accessToken, refreshToken }) {
  const storage = getPersistentStorage() || getSessionStorage()
  if (!storage) return
  if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuthTokens() {
  for (const storage of [getPersistentStorage(), getSessionStorage()]) {
    if (!storage) continue
    try {
      AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
    } catch {
      // Storage can become unavailable between reads and writes.
    }
  }
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
