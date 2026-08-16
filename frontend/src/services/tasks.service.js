import { httpClient } from '../api/httpClient'
import { TASKS } from '../api/endpoints'

export const tasksService = {
  list: (params) => httpClient.get(TASKS.LIST, { params }),
  get: (id) => httpClient.get(TASKS.DETAIL(id)),
  create: (payload) => httpClient.post(TASKS.CREATE, payload),
  update: (id, payload) => httpClient.patch(TASKS.UPDATE(id), payload),
}
