import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { notificationsService } from '../../services/notifications.service'
import { useAuth } from '../auth/useAuth'

const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 30000
const INITIAL_DELAY_MS = 700

/**
 * Notifications should never compete with the CRM's first useful paint.
 * Startup only refreshes the unread badge in the background; the heavier
 * notification list is fetched lazily the first time the dropdown opens.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const listLoadedAtRef = useRef(0)

  const fetchUnreadCount = useCallback(async () => {
    if (document.hidden) return
    try {
      const unread = await notificationsService.getUnreadCount()
      setUnreadCount(unread?.count ?? 0)
      setError(null)
    } catch (err) {
      setError(err)
    }
  }, [])

  const fetchNotifications = useCallback(async ({ force = false } = {}) => {
    if (document.hidden) return
    if (!force && listLoadedAtRef.current && Date.now() - listLoadedAtRef.current < 5000) return
    setLoading(true)
    try {
      const list = await notificationsService.list({ pageSize: 20 })
      const items = list?.items ?? []
      setNotifications(items)
      setUnreadCount(items.filter((item) => !item.isRead).length)
      listLoadedAtRef.current = Date.now()
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const isPartner = user?.role === 'PARTNER'
    if (!isAuthenticated || isPartner) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      listLoadedAtRef.current = 0
      return undefined
    }

    const initialTimer = window.setTimeout(() => {
      fetchUnreadCount().catch(() => {})
    }, INITIAL_DELAY_MS)
    const interval = window.setInterval(() => {
      fetchUnreadCount().catch(() => {})
    }, POLL_INTERVAL_MS)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [isAuthenticated, user?.id, user?.role, fetchUnreadCount])

  const markRead = useCallback(async (id) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)))
    setUnreadCount((count) => Math.max(0, count - 1))
    try {
      await notificationsService.markRead(id)
    } catch {
      // Next poll/list load reconciles server state.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await notificationsService.markAllRead()
    } catch {
      // Next poll/list load reconciles server state.
    }
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markRead,
      markAllRead,
      refetch: () => fetchNotifications({ force: true }),
      loadNotifications: fetchNotifications,
    }),
    [notifications, unreadCount, loading, error, markRead, markAllRead, fetchNotifications]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
