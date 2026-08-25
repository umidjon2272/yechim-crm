import { httpClient } from '../api/httpClient'
import { REMINDERS } from '../api/endpoints'

export const remindersService = {
  list: (params) => httpClient.get(REMINDERS.LIST, { params }),
  today: () => httpClient.get(REMINDERS.TODAY),
  overdue: () => httpClient.get(REMINDERS.OVERDUE),
  create: (payload) => httpClient.post(REMINDERS.CREATE, payload),
  complete: (id) => httpClient.post(REMINDERS.COMPLETE(id)),
  cancel: (id) => httpClient.post(REMINDERS.CANCEL(id)),
  todayWork: () => httpClient.get(REMINDERS.TODAY_WORK),
}
