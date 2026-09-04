import { httpClient } from '../api/httpClient'
import { NOTIFICATIONS } from '../api/endpoints'

export const notificationsService = {
  list: (params) => httpClient.get(NOTIFICATIONS.LIST, { params, cacheTtlMs: 15000 }),
  getUnreadCount: () => httpClient.get(NOTIFICATIONS.UNREAD_COUNT, { cacheTtlMs: 15000 }),
  markRead: (id) => httpClient.patch(NOTIFICATIONS.MARK_READ(id)),
  markAllRead: () => httpClient.post(NOTIFICATIONS.MARK_ALL_READ),
}
