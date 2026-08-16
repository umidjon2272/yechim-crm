import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { notificationsService } from '../../services/notifications.service'
import { useAuth } from '../auth/useAuth'

const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 30000

/**
 * Polling-based notifications (no WebSocket yet — see Phase 2 plan). Only
 * polls while authenticated, and skips fetches while the tab is hidden to
 * avoid hammering the backend from background tabs.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async () => {
    if (document.hidden) return
    try {
      const [list, unread] = await Promise.all([
        notificationsService.list({ pageSize: 20 }),
        notificationsService.getUnreadCount(),
      ])
      setNotifications(list?.items ?? [])
      setUnreadCount(unread?.count ?? 0)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return undefined
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  const markRead = useCallback(async (id) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((count) => Math.max(0, count - 1))
    try {
      await notificationsService.markRead(id)
    } catch {
      // Optimistic update stands even if the backend call fails silently —
      // the next poll cycle will reconcile with server state.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await notificationsService.markAllRead()
    } catch {
      // see markRead
    }
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, error, markRead, markAllRead, refetch: fetchNotifications }),
    [notifications, unreadCount, loading, error, markRead, markAllRead, fetchNotifications]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
