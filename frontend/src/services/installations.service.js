import { httpClient } from '../api/httpClient'
import { INSTALLATIONS, ACTIVITIES, TASKS } from '../api/endpoints'

export const installationsService = {
  list: (params) => httpClient.get(INSTALLATIONS.LIST, { params }),
  get: (id) => httpClient.get(INSTALLATIONS.DETAIL(id)),
  create: (payload) => httpClient.post(INSTALLATIONS.CREATE, payload),
  update: (id, payload) => httpClient.patch(INSTALLATIONS.UPDATE(id), payload),

  getActivities: (id) => httpClient.get(ACTIVITIES.LIST, { params: { installationId: id } }),
  getTasks: (id) => httpClient.get(TASKS.LIST, { params: { installationId: id } }),
}
