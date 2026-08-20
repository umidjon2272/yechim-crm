const ACCESS_TOKEN_KEY = 'yechim.auth.accessToken'
const REFRESH_TOKEN_KEY = 'yechim.auth.refreshToken'

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
  const accessToken = persistentStorage?.getItem(ACCESS_TOKEN_KEY) || null
  const refreshToken = persistentStorage?.getItem(REFRESH_TOKEN_KEY) || null
  if (accessToken || refreshToken) return { accessToken, refreshToken }

  // Migrate a session created by the previous tab-scoped build. Do not store
  // a user object: the backend remains the source of truth for identity and
  // permissions on every app launch.
  const sessionStorage = getSessionStorage()
  const legacyAccessToken = sessionStorage?.getItem(ACCESS_TOKEN_KEY) || null
  const legacyRefreshToken = sessionStorage?.getItem(REFRESH_TOKEN_KEY) || null
  if (persistentStorage && (legacyAccessToken || legacyRefreshToken)) {
    if (legacyAccessToken) persistentStorage.setItem(ACCESS_TOKEN_KEY, legacyAccessToken)
    if (legacyRefreshToken) persistentStorage.setItem(REFRESH_TOKEN_KEY, legacyRefreshToken)
  }
  return { accessToken: legacyAccessToken, refreshToken: legacyRefreshToken }
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
    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
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
