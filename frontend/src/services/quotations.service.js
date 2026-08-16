import { httpClient } from '../api/httpClient'
import { QUOTATIONS } from '../api/endpoints'

export const quotationsService = {
  list: (params) => httpClient.get(QUOTATIONS.LIST, { params }),
  get: (id) => httpClient.get(QUOTATIONS.DETAIL(id)),
  create: (payload) => httpClient.post(QUOTATIONS.CREATE, payload),
  update: (id, payload) => httpClient.patch(QUOTATIONS.UPDATE(id), payload),
  send: (id) => httpClient.post(QUOTATIONS.SEND(id)),
  accept: (id) => httpClient.post(QUOTATIONS.ACCEPT(id)),
  reject: (id) => httpClient.post(QUOTATIONS.REJECT(id)),
}
