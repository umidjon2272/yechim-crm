import { httpClient } from '../api/httpClient'
import { COMMENTS } from '../api/endpoints'

export const commentsService = {
  list: (entityType, entityId) => httpClient.get(COMMENTS.LIST, { params: { entityType, entityId } }),
  create: (payload) => httpClient.post(COMMENTS.CREATE, payload),
  update: (id, payload) => httpClient.patch(COMMENTS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(COMMENTS.DELETE(id)),
}
