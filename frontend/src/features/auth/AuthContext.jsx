import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'
import { AUTH_STORAGE_KEYS, clearAuthTokens, clearLegacyAuthStorage, readAuthTokens, writeAuthTokens } from './authStorage'

const AuthContext = createContext(null)

// status: 'checking' | 'authenticated' | 'unauthenticated' | 'error'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const userRef = useRef(null)
  const authEpochRef = useRef(0)
  const hydratePromiseRef = useRef(null)
  const [status, setStatus] = useState('checking')
  const [authError, setAuthError] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const updateUser = useCallback((nextUser) => {
    userRef.current = nextUser
    setUser(nextUser)
  }, [])

  const hydrateSession = useCallback(() => {
    if (hydratePromiseRef.current) return hydratePromiseRef.current

    const hydratePromise = (async () => {
      const requestEpoch = ++authEpochRef.current
      clearLegacyAuthStorage()
      setAuthError(null)
      setStatus('checking')
      const { accessToken, refreshToken } = readAuthTokens()

      // Tokens are persisted for the installed PWA, but the user identity is
      // never guessed from storage. It must be confirmed by the backend.
      if (!accessToken && !refreshToken) {
        if (requestEpoch !== authEpochRef.current) return
        updateUser(null)
        setStatus('unauthenticated')
        return
      }

      try {
        performance.mark?.('yechim:auth:restore:start')
        const restoreStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
        // httpClient uses the persistent access token. If it is expired, it
        // refreshes with the persistent refresh token and retries /auth/me.
        const currentUser = await authService.getCurrentUser()
        performance.mark?.('yechim:auth:restore:end')
        if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF_TIMING === 'true') {
          const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - restoreStartedAt
          console.info(`[YECHIM perf] auth restore ${Math.round(elapsed)}ms`)
        }
        if (requestEpoch !== authEpochRef.current) return
        if (!currentUser?.id) {
          clearAuthTokens()
          updateUser(null)
          setStatus('unauthenticated')
          return
        }
        updateUser(currentUser)
        setStatus('authenticated')
      } catch (error) {
        if (requestEpoch !== authEpochRef.current) return
        // Only an explicit 401 means that the refresh/session is invalid. Keep
        // the existing authenticated user during a transient outage instead of
        // redirecting to login merely because the API is temporarily offline.
        if (error?.status === 401) {
          clearAuthTokens()
          updateUser(null)
          setStatus('unauthenticated')
        } else if (userRef.current) {
          setStatus('authenticated')
        } else {
          // A transient outage is terminal after bounded request retries.
          // Preserve stored tokens and expose a retryable startup state rather
          // than leaving ProtectedRoute in an infinite checking state.
          setAuthError(error)
          setStatus('error')
        }
      }
    })()

    hydratePromiseRef.current = hydratePromise
    hydratePromise.finally(() => {
      if (hydratePromiseRef.current === hydratePromise) hydratePromiseRef.current = null
    }).catch(() => {})
    return hydratePromise
  }, [updateUser])

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  const handleUnauthorized = useCallback(() => {
    authEpochRef.current += 1
    clearAuthTokens()
    clearLegacyAuthStorage()
    updateUser(null)
    setStatus('unauthenticated')
  }, [updateUser])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  useEffect(() => {
    const handleStorageChange = (event) => {
      // localStorage is shared by the browser and installed PWA. If another
      // context logs out or replaces the account, immediately hide protected
      // UI here too; waiting for the next API call would leave stale account
      // content visible.
      if (AUTH_STORAGE_KEYS.includes(event.key) && event.newValue === null) {
        handleUnauthorized()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [handleUnauthorized])

  const login = useCallback(
    async (credentials) => {
      const requestEpoch = ++authEpochRef.current
      // Replacing an account clears the persisted token pair before login.
      clearAuthTokens()
      setLoginLoading(true)
      setLoginError(null)
      setAuthError(null)
      try {
        const response = await authService.login(credentials)
        if (requestEpoch !== authEpochRef.current) return response?.user

        if (!response?.accessToken || !response?.refreshToken) {
          throw new Error('Backend foydalanuvchi sessiyasini qaytarmadi')
        }
        writeAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken })
        // The login payload is not the auth source of truth. Resolve the
        // identity and permissions from the session through /auth/me, just as
        // we do after F5. This also exercises the freshly issued access token.
        const loggedInUser = await authService.getCurrentUser()
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
    },
    [updateUser],
  )

  const logout = useCallback(async () => {
    const requestEpoch = ++authEpochRef.current
    const tokens = readAuthTokens()

    // Hide protected UI and clear the persisted token pair immediately. The
    // captured tokens let the server revoke exactly this UserSession below.
    clearAuthTokens()
    clearLegacyAuthStorage()
    updateUser(null)
    setStatus('unauthenticated')
    setLoginError(null)
    try {
      await authService.logout(tokens)
    } finally {
      if (requestEpoch === authEpochRef.current) {
        clearAuthTokens()
        clearLegacyAuthStorage()
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
      isStartupError: status === 'error',
      login,
      loginLoading,
      loginError,
      authError,
      logout,
      refreshUser: hydrateSession,
    }),
    [user, status, login, loginLoading, loginError, authError, logout, hydrateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
