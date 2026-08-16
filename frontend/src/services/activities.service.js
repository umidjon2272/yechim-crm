import { httpClient } from '../api/httpClient'
import { ACTIVITIES } from '../api/endpoints'

export const activitiesService = {
  list: (params) => httpClient.get(ACTIVITIES.LIST, { params }),
  get: (id) => httpClient.get(ACTIVITIES.DETAIL(id)),
  create: (payload) => httpClient.post(ACTIVITIES.CREATE, payload),
}
