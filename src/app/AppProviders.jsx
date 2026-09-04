import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import { NotificationsProvider } from '../features/notifications/NotificationsContext'
import { UIProvider } from '../store/UIContext'
import { ToastProvider } from '../store/ToastContext'
import { ConfirmProvider } from '../store/ConfirmContext'

export function AppProviders({ children }) {
  useEffect(() => {
    const handlePageShow = (event) => {
      // A protected route can be restored from the browser back/forward cache
      // after logout. Reloading that stale document makes AuthProvider verify
      // the persisted token pair before showing any protected UI.
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationsProvider>
          <ToastProvider>
            <ConfirmProvider>
              <UIProvider>{children}</UIProvider>
            </ConfirmProvider>
          </ToastProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
