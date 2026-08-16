import { httpClient } from '../api/httpClient'
import { NOTIFICATIONS } from '../api/endpoints'

export const notificationsService = {
  list: (params) => httpClient.get(NOTIFICATIONS.LIST, { params }),
  getUnreadCount: () => httpClient.get(NOTIFICATIONS.UNREAD_COUNT),
  markRead: (id) => httpClient.post(NOTIFICATIONS.MARK_READ(id)),
  markAllRead: () => httpClient.post(NOTIFICATIONS.MARK_ALL_READ),
}
