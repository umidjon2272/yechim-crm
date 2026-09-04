import { httpClient } from '../api/httpClient'
import { TIMELINE } from '../api/endpoints'

export const timelineService = {
  get: (entityType, entityId) => httpClient.get(TIMELINE.GET, { params: { entityType, entityId } }),
}
