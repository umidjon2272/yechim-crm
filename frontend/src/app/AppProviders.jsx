import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import { NotificationsProvider } from '../features/notifications/NotificationsContext'
import { UIProvider } from '../store/UIContext'
import { ToastProvider } from '../store/ToastContext'
import { ConfirmProvider } from '../store/ConfirmContext'

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
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
