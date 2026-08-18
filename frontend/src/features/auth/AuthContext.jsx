import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'

const AuthContext = createContext(null)

// Authentication has one source of truth: the backend's httpOnly cookies.
// Remove keys left by older/demo builds so they cannot be mistaken for a
// current session. The raw access/refresh tokens are never stored by this app.
const LEGACY_AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'authToken',
  'token',
  'authUser',
  'currentUser',
  'bold-yechim-demo-session-v1',
]

const AUTH_STORAGE_KEY_PATTERN = /(?:auth|token|session|currentuser)/i

function clearClientAuthStorage({ clearAll = false } = {}) {
  if (typeof window === 'undefined') return
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName]
      if (clearAll) {
        // The current app keeps no CRM data in Web Storage. Clearing both
        // stores on logout prevents a previous/demo build from rehydrating a
        // user after the server session has been revoked.
        storage.clear()
        continue
      }
      const keys = new Set(LEGACY_AUTH_STORAGE_KEYS)
      Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key) => key && AUTH_STORAGE_KEY_PATTERN.test(key))
        .forEach((key) => keys.add(key))
      keys.forEach((key) => storage.removeItem(key))
    } catch {
      // Storage may be unavailable in private browsing or restricted frames.
    }
  }
}

// status: 'checking' | 'authenticated' | 'unauthenticated'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const userRef = useRef(null)
  const authEpochRef = useRef(0)
  const [status, setStatus] = useState('checking')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const updateUser = useCallback((nextUser) => {
    userRef.current = nextUser
    setUser(nextUser)
  }, [])

  const hydrateSession = useCallback(async () => {
    const requestEpoch = ++authEpochRef.current
    clearClientAuthStorage()
    try {
      const currentUser = await authService.getCurrentUser()
      if (requestEpoch !== authEpochRef.current) return
      if (!currentUser?.id) {
        updateUser(null)
        setStatus('unauthenticated')
        return
      }
      updateUser(currentUser)
      setStatus('authenticated')
    } catch (error) {
      if (requestEpoch !== authEpochRef.current) return
      // A transient/network failure must not log out an existing user. A 401
      // means that /me and the single refresh attempt both failed, so the
      // session is genuinely invalid (or the account is no longer active).
      if (error?.status === 401 || !userRef.current) {
        updateUser(null)
        setStatus('unauthenticated')
      }
    }
  }, [updateUser])

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  const handleUnauthorized = useCallback(() => {
    authEpochRef.current += 1
    clearClientAuthStorage()
    updateUser(null)
    setStatus('unauthenticated')
  }, [updateUser])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  const login = useCallback(async (credentials) => {
    const requestEpoch = ++authEpochRef.current
    clearClientAuthStorage()
    setLoginLoading(true)
    setLoginError(null)
    try {
      // The real login response already contains the validated public user;
      // avoid making a second request that could turn a successful login into
      // a logout during a transient network interruption.
      const loggedInUser = await authService.login(credentials)
      if (requestEpoch !== authEpochRef.current) return loggedInUser
      if (!loggedInUser?.id) throw new Error('Backend foydalanuvchi sessiyasini qaytarmadi')
      updateUser(loggedInUser)
      setStatus('authenticated')
      return loggedInUser
    } catch (err) {
      setLoginError(err.message || 'Kirishda xatolik yuz berdi')
      throw err
    } finally {
      setLoginLoading(false)
    }
  }, [updateUser])

  const logout = useCallback(async () => {
    const requestEpoch = ++authEpochRef.current
    // Hide protected UI immediately. A slow /me response can no longer
    // restore this session because its epoch is now stale.
    clearClientAuthStorage({ clearAll: true })
    updateUser(null)
    setStatus('unauthenticated')
    setLoginError(null)
    try {
      await authService.logout()
    } finally {
      if (requestEpoch === authEpochRef.current) {
        clearClientAuthStorage({ clearAll: true })
        updateUser(null)
        setStatus('unauthenticated')
      }
    }
  }, [updateUser])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isChecking: status === 'checking',
      login,
      loginLoading,
      loginError,
      logout,
      refreshUser: hydrateSession,
    }),
    [user, status, login, loginLoading, loginError, logout, hydrateSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
