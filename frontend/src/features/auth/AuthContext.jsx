import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../../services/auth.service'
import { setUnauthorizedHandler } from '../../api/httpClient'
import { ROLES } from '../roles/permissions'

const AuthContext = createContext(null)

// ---------------------------------------------------------------------------
// TEMPORARY DEMO BYPASS — requested to unblock viewing the deployed UI while
// the Vercel backend isn't reliable yet. Skips the real /auth/me check and
// always presents a stub SUPER_ADMIN session instead of showing the login
// screen. REMOVE this block (and just call hydrateSession's original body)
// once the real backend is connected and login should be required again.
const DEMO_BYPASS_AUTH = false
const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo foydalanuvchi',
  email: 'demo@bold-yechim.uz',
  role: ROLES.SUPER_ADMIN,
  permissions: [],
  status: 'active',
}
// ---------------------------------------------------------------------------

// status: 'checking' | 'authenticated' | 'unauthenticated'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('checking')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const hydrateSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setStatus('authenticated')
    } catch {
      if (DEMO_BYPASS_AUTH) {
        setUser(DEMO_USER)
        setStatus('authenticated')
        return
      }
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (credentials) => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      await authService.login(credentials)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setStatus('authenticated')
      return currentUser
    } catch (err) {
      setLoginError(err.message || 'Kirishda xatolik yuz berdi')
      throw err
    } finally {
      setLoginLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

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
