import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { notificationsService } from '../../services/notifications.service'
import { useAuth } from '../auth/useAuth'

const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 45000
const INITIAL_DELAY_MS = 1500
const LIST_CACHE_MS = 15000

/**
 * One shared notifications source for the header dropdown and the full page.
 * The old page created its own list request while the provider separately
 * requested unread-count/list data, which produced duplicate traffic.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const listLoadedAtRef = useRef(0)
  const listPageSizeRef = useRef(0)
  const listPromiseRef = useRef(null)
  const unreadPromiseRef = useRef(null)

  const onNotificationsPage = location.pathname.includes('/notifications')

  const fetchUnreadCount = useCallback(async ({ force = false } = {}) => {
    if (document.hidden) return null
    if (!force && unreadPromiseRef.current) return unreadPromiseRef.current
    const run = notificationsService.getUnreadCount()
      .then((unread) => {
        setUnreadCount(unread?.count ?? 0)
        setError(null)
        return unread
      })
      .catch((err) => {
        setError(err)
        throw err
      })
      .finally(() => {
        if (unreadPromiseRef.current === run) unreadPromiseRef.current = null
      })
    unreadPromiseRef.current = run
    return run
  }, [])

  const fetchNotifications = useCallback(async ({ force = false, pageSize = 20 } = {}) => {
    if (document.hidden) return null
    const requestedPageSize = Math.max(1, Number(pageSize) || 20)
    const isFresh = listLoadedAtRef.current && Date.now() - listLoadedAtRef.current < LIST_CACHE_MS
    if (!force && isFresh && listPageSizeRef.current >= requestedPageSize) return null
    if (listPromiseRef.current) return listPromiseRef.current

    setLoading(true)
    const run = notificationsService.list({ pageSize: requestedPageSize })
      .then((list) => {
        const items = list?.items ?? []
        setNotifications(items)
        setUnreadCount(items.filter((item) => !item.isRead).length)
        listLoadedAtRef.current = Date.now()
        listPageSizeRef.current = requestedPageSize
        setError(null)
        return list
      })
      .catch((err) => {
        setError(err)
        throw err
      })
      .finally(() => {
        setLoading(false)
        if (listPromiseRef.current === run) listPromiseRef.current = null
      })
    listPromiseRef.current = run
    return run
  }, [])

  useEffect(() => {
    const isPartner = user?.role === 'PARTNER'
    if (!isAuthenticated || isPartner) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      listLoadedAtRef.current = 0
      listPageSizeRef.current = 0
      return undefined
    }

    // On the notifications route the full list request supplies the unread
    // count too, so do not race it with an extra startup unread-count request.
    const initialTimer = onNotificationsPage ? null : window.setTimeout(() => {
      fetchUnreadCount().catch(() => {})
    }, INITIAL_DELAY_MS)
    const interval = window.setInterval(() => {
      // Keep the badge fresh without refetching the full list.
      fetchUnreadCount({ force: true }).catch(() => {})
    }, POLL_INTERVAL_MS)
    return () => {
      if (initialTimer) window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [isAuthenticated, user?.id, user?.role, onNotificationsPage, fetchUnreadCount])

  const markRead = useCallback(async (id) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)))
    setUnreadCount((count) => Math.max(0, count - 1))
    try {
      await notificationsService.markRead(id)
    } catch {
      // A later count/list request reconciles server state.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await notificationsService.markAllRead()
    } catch {
      // A later count/list request reconciles server state.
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
      refetch: (options = {}) => fetchNotifications({ ...options, force: true }),
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
