import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'
import { ROLES } from '../roles/permissions'
import { restoreWithRetry } from './authStartupRetry'

const AuthContext = createContext(null)

// Kept disabled. It exists only for the old local demo mode.
const DEMO_BYPASS_AUTH = false
const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo foydalanuvchi',
  email: 'demo@bold-yechim.uz',
  role: ROLES.SUPER_ADMIN,
  permissions: [],
  status: 'active',
}

// status: checking | authenticated | unauthenticated | retryableError
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('checking')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [startupStartedAt, setStartupStartedAt] = useState(null)
  const userRef = useRef(null)
  const startupAttemptRef = useRef(0)
  const hydratePromiseRef = useRef(null)

  const updateUser = useCallback((nextUser) => {
    userRef.current = nextUser
    setUser(nextUser)
  }, [])

  const hydrateSession = useCallback(({ force = false } = {}) => {
    if (hydratePromiseRef.current && !force) return hydratePromiseRef.current

    const attemptId = startupAttemptRef.current + 1
    startupAttemptRef.current = attemptId
    const startedAt = Date.now()
    setStartupStartedAt(startedAt)
    setAuthError(null)
    if (!userRef.current) setStatus('checking')

    const promise = (async () => {
      const result = await restoreWithRetry(({ timeoutMs }) => authService.getCurrentUser({ timeoutMs }))
      if (startupAttemptRef.current !== attemptId) return null

      if (result.kind === 'success') {
        updateUser(result.value)
        setAuthError(null)
        setStartupStartedAt(null)
        setStatus('authenticated')
        return result.value
      }

      // 401 remains an auth result. It is never treated as a cold start.
      if (result.kind === 'unauthorized') {
        if (DEMO_BYPASS_AUTH) {
          updateUser(DEMO_USER)
          setStatus('authenticated')
          return DEMO_USER
        }
        updateUser(null)
        setStartupStartedAt(null)
        setStatus('unauthenticated')
        return null
      }

      if (userRef.current) {
        // A background refresh failure must not blank an already-open CRM.
        setStatus('authenticated')
      } else {
        setAuthError(result.error)
        setStatus('retryableError')
      }
      return null
    })()

    hydratePromiseRef.current = promise
    promise.finally(() => {
      if (hydratePromiseRef.current === promise) hydratePromiseRef.current = null
    }).catch(() => {})
    return promise
  }, [updateUser])

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      startupAttemptRef.current += 1
      updateUser(null)
      setAuthError(null)
      setStartupStartedAt(null)
      setStatus('unauthenticated')
    })
    return () => setUnauthorizedHandler(null)
  }, [updateUser])

  const login = useCallback(async (credentials) => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      await authService.login(credentials)
      const currentUser = await authService.getCurrentUser()
      updateUser(currentUser)
      setStatus('authenticated')
      return currentUser
    } catch (err) {
      setLoginError(err.message || 'Kirishda xatolik yuz berdi')
      throw err
    } finally {
      setLoginLoading(false)
    }
  }, [updateUser])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      startupAttemptRef.current += 1
      updateUser(null)
      setAuthError(null)
      setStartupStartedAt(null)
      setStatus('unauthenticated')
    }
  }, [updateUser])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isChecking: status === 'checking',
      isStartupError: status === 'retryableError',
      authError,
      startupStartedAt,
      login,
      loginLoading,
      loginError,
      logout,
      refreshUser: hydrateSession,
    }),
    [user, status, authError, startupStartedAt, login, loginLoading, loginError, logout, hydrateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
