import { httpClient } from '../api/httpClient'
import { ROLES } from '../api/endpoints'

export const rolesService = {
  list: () => httpClient.get(ROLES.LIST),
  get: (id) => httpClient.get(ROLES.DETAIL(id)),
  create: (payload) => httpClient.post(ROLES.CREATE, payload),
  update: (id, payload) => httpClient.patch(ROLES.UPDATE(id), payload),
  remove: (id) => httpClient.delete(ROLES.DELETE(id)),
  getPermissionsSchema: () => httpClient.get(ROLES.PERMISSIONS_SCHEMA),
}
