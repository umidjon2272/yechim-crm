import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'
import { AUTH_STORAGE_KEYS, clearAuthTokens, clearLegacyAuthStorage, readAuthTokens, readCachedAuthUser, writeAuthTokens, writeCachedAuthUser } from './authStorage'
import { restoreWithRetry } from './authStartupRetry'

const AuthContext = createContext(null)

export const AUTH_STATES = Object.freeze({
  IDLE: 'idle',
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  RETRYABLE_ERROR: 'retryableError',
})
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const { accessToken, refreshToken } = readAuthTokens()
    return accessToken || refreshToken ? readCachedAuthUser() : null
  })
  const userRef = useRef(null)
  const authEpochRef = useRef(0)
  const hydratePromiseRef = useRef(null)
  const [status, setStatus] = useState(() => {
    const { accessToken, refreshToken } = readAuthTokens()
    return (accessToken || refreshToken) && readCachedAuthUser()?.id ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.IDLE
  })
  const [authError, setAuthError] = useState(null)
  const [startupStartedAt, setStartupStartedAt] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const updateUser = useCallback((nextUser) => {
    userRef.current = nextUser
    setUser(nextUser)
  }, [])

  const hydrateSession = useCallback(({ force = false } = {}) => {
    if (hydratePromiseRef.current && !force) return hydratePromiseRef.current

    const hydratePromise = (async () => {
      const requestEpoch = ++authEpochRef.current
      clearLegacyAuthStorage()
      setAuthError(null)
      const { accessToken, refreshToken } = readAuthTokens()
      const cachedUser = readCachedAuthUser()
      const canRenderCachedShell = Boolean((accessToken || refreshToken) && cachedUser?.id)

      // Returning users should not stare at a full-screen startup blocker while
      // a sleeping backend wakes. Render the last confirmed identity/permissions
      // immediately, then validate the session in the background. Protected API
      // requests are still enforced server-side, so this is a UX cache only.
      if (canRenderCachedShell) {
        if (!userRef.current?.id) updateUser(cachedUser)
        setStatus(AUTH_STATES.AUTHENTICATED)
      } else {
        setStatus(AUTH_STATES.CHECKING)
      }

      // Tokens are persisted for the installed PWA, but the user identity is
      // never guessed from storage. It must be confirmed by the backend.
      if (!accessToken && !refreshToken) {
        if (requestEpoch !== authEpochRef.current) return
        updateUser(null)
        setStartupStartedAt(null)
        setStatus(AUTH_STATES.UNAUTHENTICATED)
        return
      }

      try {
        setStartupStartedAt(Date.now())
        performance.mark?.('yechim:auth:restore:start')

        // Do not preflight /health before auth. That extra request made every
        // cold start pay twice (wake server, then authenticate). The first
        // /auth/me request itself now receives a long startup timeout, so the
        // sleeping backend can wake and answer the request in one round trip.
        // Returning users with a cached identity already see the CRM shell
        // while this validation happens in the background.

        const restoreStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
        // httpClient uses the persistent access token. If it is expired, it
        // refreshes with the persistent refresh token and retries /auth/me.
        const restoreResult = await restoreWithRetry(
          ({ timeoutMs, attempt }) => authService.getCurrentUser({ timeoutMs, attempt, maxRetries: 0 }),
        )
        performance.mark?.('yechim:auth:restore:end')
        if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF_TIMING === 'true') {
          const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - restoreStartedAt
          console.info(`[YECHIM perf] auth restore ${Math.round(elapsed)}ms`)
        }
        if (requestEpoch !== authEpochRef.current) return
        if (restoreResult.kind === 'unauthorized') {
          clearAuthTokens()
          clearLegacyAuthStorage()
          updateUser(null)
          setStartupStartedAt(null)
          setStatus(AUTH_STATES.UNAUTHENTICATED)
          return
        }
        if (restoreResult.kind !== 'success') {
          setAuthError(restoreResult.error)
          setStartupStartedAt(null)
          if (userRef.current) setStatus(AUTH_STATES.AUTHENTICATED)
          else setStatus(AUTH_STATES.RETRYABLE_ERROR)
          return
        }
        const currentUser = restoreResult.value
        if (!currentUser?.id) {
          clearAuthTokens()
          updateUser(null)
          setStartupStartedAt(null)
          setStatus(AUTH_STATES.UNAUTHENTICATED)
          return
        }
        writeCachedAuthUser(currentUser)
        updateUser(currentUser)
        setStartupStartedAt(null)
        setStatus(AUTH_STATES.AUTHENTICATED)
      } catch (error) {
        if (requestEpoch !== authEpochRef.current) return
        // Only an explicit 401 means that the refresh/session is invalid. Keep
        // the existing authenticated user during a transient outage instead of
        // redirecting to login merely because the API is temporarily offline.
        if (error?.status === 401) {
          clearAuthTokens()
          clearLegacyAuthStorage()
          updateUser(null)
          setStartupStartedAt(null)
          setStatus(AUTH_STATES.UNAUTHENTICATED)
        } else if (userRef.current) {
          setStartupStartedAt(null)
          setStatus(AUTH_STATES.AUTHENTICATED)
        } else {
          // A transient outage is terminal after bounded request retries.
          // Preserve stored tokens and expose a retryable startup state rather
          // than leaving ProtectedRoute in an infinite checking state.
          setAuthError(error)
          setStatus(AUTH_STATES.RETRYABLE_ERROR)
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
    setStatus(AUTH_STATES.UNAUTHENTICATED)
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
      if (!AUTH_STORAGE_KEYS.includes(event.key)) return
      if (event.newValue === null) {
        handleUnauthorized()
        return
      }
      // Another tab/PWA window may have switched accounts. Revalidate rather
      // than leaving this tab with a stale cached user.
      hydrateSession({ force: true })
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [handleUnauthorized, hydrateSession])

  const login = useCallback(
    async (credentials) => {
      const requestEpoch = ++authEpochRef.current
      // Replacing an account clears the persisted token pair before login.
      clearAuthTokens()
      setLoginLoading(true)
      setLoginError(null)
      setAuthError(null)
      setStartupStartedAt(null)
      try {
        const response = await authService.login(credentials)
        if (requestEpoch !== authEpochRef.current) return response?.user

        if (!response?.accessToken || !response?.refreshToken) {
          throw new Error('Backend foydalanuvchi sessiyasini qaytarmadi')
        }
        writeAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken })
        // The login response was just authenticated by the backend and already
        // contains the public user/permissions. Cache it immediately so future
        // PWA/browser opens can render the CRM shell without waiting on /me.
        // /auth/me still validates the persisted session in the background.
        const loggedInUser = response?.user
        if (!loggedInUser?.id) throw new Error('Backend foydalanuvchi sessiyasini qaytarmadi')
        writeCachedAuthUser(loggedInUser)
        updateUser(loggedInUser)
        setStatus(AUTH_STATES.AUTHENTICATED)
        setStartupStartedAt(null)
        hydrateSession({ force: true }).catch(() => {})
        return loggedInUser
      } catch (err) {
        setLoginError(err.message || 'Kirishda xatolik yuz berdi')
        throw err
      } finally {
        setLoginLoading(false)
      }
    },
    [hydrateSession, updateUser],
  )

  const logout = useCallback(async () => {
    const requestEpoch = ++authEpochRef.current
    const tokens = readAuthTokens()

    // Hide protected UI and clear the persisted token pair immediately. The
    // captured tokens let the server revoke exactly this UserSession below.
    clearAuthTokens()
    clearLegacyAuthStorage()
    updateUser(null)
    setStartupStartedAt(null)
    setStatus(AUTH_STATES.UNAUTHENTICATED)
    setLoginError(null)
    try {
      await authService.logout(tokens)
    } finally {
      if (requestEpoch === authEpochRef.current) {
        clearAuthTokens()
        clearLegacyAuthStorage()
        updateUser(null)
        setStatus(AUTH_STATES.UNAUTHENTICATED)
      }
    }
  }, [updateUser])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === AUTH_STATES.AUTHENTICATED,
      isChecking: status === AUTH_STATES.IDLE || status === AUTH_STATES.CHECKING,
      isStartupError: status === AUTH_STATES.RETRYABLE_ERROR,
      login,
      loginLoading,
      loginError,
      authError,
      startupStartedAt,
      logout,
      refreshUser: hydrateSession,
    }),
    [user, status, login, loginLoading, loginError, authError, startupStartedAt, logout, hydrateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
