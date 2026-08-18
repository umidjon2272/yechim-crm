import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'
import { clearAuthTokens, clearLegacyAuthStorage, readAuthTokens, writeAuthTokens } from './authStorage'

const AuthContext = createContext(null)

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
    clearLegacyAuthStorage()
    const { accessToken, refreshToken } = readAuthTokens()

    // No token in this tab means there is no session to restore. In
    // particular, never fall back to localStorage, a default user, or a
    // browser-wide cookie.
    if (!accessToken && !refreshToken) {
      if (requestEpoch !== authEpochRef.current) return
      updateUser(null)
      setStatus('unauthenticated')
      return
    }

    try {
      // httpClient uses this tab's access token. If it is expired, it first
      // refreshes with this tab's refresh token and retries /auth/me.
      const currentUser = await authService.getCurrentUser()
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
      // A 401 means this tab's session is invalid. A transient error should
      // not replace an already-rendered authenticated user.
      if (error?.status === 401 || !userRef.current) {
        if (error?.status === 401) clearAuthTokens()
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
    clearAuthTokens()
    updateUser(null)
    setStatus('unauthenticated')
  }, [updateUser])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  const login = useCallback(
    async (credentials) => {
      const requestEpoch = ++authEpochRef.current
      // Replacing an account in this tab replaces only this tab's token pair.
      clearAuthTokens()
      setLoginLoading(true)
      setLoginError(null)
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

    // Hide protected UI and clear only this tab immediately. The captured
    // tokens let the server revoke exactly this UserSession below.
    clearAuthTokens()
    updateUser(null)
    setStatus('unauthenticated')
    setLoginError(null)
    try {
      await authService.logout(tokens)
    } finally {
      if (requestEpoch === authEpochRef.current) {
        clearAuthTokens()
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
    [user, status, login, loginLoading, loginError, logout, hydrateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
