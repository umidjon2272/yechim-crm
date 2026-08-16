import { httpClient } from '../api/httpClient'
import { TEAMS } from '../api/endpoints'

export const teamsService = {
  list: (params) => httpClient.get(TEAMS.LIST, { params }),
  get: (id) => httpClient.get(TEAMS.DETAIL(id)),
  create: (payload) => httpClient.post(TEAMS.CREATE, payload),
  update: (id, payload) => httpClient.patch(TEAMS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(TEAMS.DELETE(id)),
}
