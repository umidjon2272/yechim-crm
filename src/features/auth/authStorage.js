const ACCESS_TOKEN_KEY = 'yechim.auth.accessToken'
const REFRESH_TOKEN_KEY = 'yechim.auth.refreshToken'
const CACHED_USER_KEY = 'yechim.auth.cachedUser'

export const AUTH_STORAGE_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, CACHED_USER_KEY]

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


export function readCachedAuthUser() {
  const storages = [getPersistentStorage(), getSessionStorage()].filter(Boolean)

  for (const storage of storages) {
    try {
      const raw = storage.getItem(CACHED_USER_KEY)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && parsed.id) return parsed
    } catch {
      // Try the legacy snapshots below.
    }
  }

  // One-time compatibility for older builds that stored the current user under
  // a generic key. This snapshot is only used to paint the shell quickly; the
  // backend still validates the token/session immediately in the background.
  for (const storage of storages) {
    for (const key of ['user', 'authUser', 'currentUser']) {
      try {
        const raw = storage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && parsed.id) {
          try {
            ;(getPersistentStorage() || storage).setItem(CACHED_USER_KEY, JSON.stringify(parsed))
          } catch {
            // Ignore storage quota/privacy failures.
          }
          return parsed
        }
      } catch {
        // Ignore malformed legacy values.
      }
    }
  }

  return null
}

export function writeCachedAuthUser(user) {
  const storage = getPersistentStorage() || getSessionStorage()
  if (!storage || !user?.id) return
  try {
    // Cached identity is only a fast UI snapshot. Backend auth/permissions
    // remain authoritative for every protected API request.
    storage.setItem(CACHED_USER_KEY, JSON.stringify(user))
  } catch {
    // Ignore quota/privacy mode failures; auth still works via the API.
  }
}

export function clearCachedAuthUser() {
  for (const storage of [getPersistentStorage(), getSessionStorage()]) {
    if (!storage) continue
    try {
      storage.removeItem(CACHED_USER_KEY)
    } catch {
      // Storage may be unavailable.
    }
  }
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
