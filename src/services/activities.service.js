import { httpClient } from '../api/httpClient'
import { ACTIVITIES, REMINDERS } from '../api/endpoints'

export const activitiesService = {
  list: (params) => httpClient.get(ACTIVITIES.LIST, { params }),
  get: (id) => httpClient.get(ACTIVITIES.DETAIL(id)),
  create: (payload) => httpClient.post(ACTIVITIES.CREATE, payload),
}

export const remindersService = {
  list: (params) => httpClient.get(REMINDERS.LIST, { params }),
  create: (payload) => httpClient.post(REMINDERS.CREATE, payload),
}
