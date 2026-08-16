import { httpClient } from '../api/httpClient'
import { ATTACHMENTS } from '../api/endpoints'

export const attachmentsService = {
  list: (entityType, entityId) => httpClient.get(ATTACHMENTS.LIST, { params: { entityType, entityId } }),

  upload: (entityType, entityId, file, onProgress) => {
    const formData = new FormData()
    formData.append('entityType', entityType)
    formData.append('entityId', entityId)
    formData.append('file', file)
    // onProgress is accepted for API-shape compatibility with a future
    // XHR/axios-based implementation that reports upload progress; plain
    // fetch has no upload-progress hook, so it's a no-op for now.
    void onProgress
    return httpClient.post(ATTACHMENTS.UPLOAD, formData)
  },

  remove: (id) => httpClient.delete(ATTACHMENTS.DELETE(id)),
}
