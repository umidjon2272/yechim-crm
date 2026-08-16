import { httpClient } from '../api/httpClient'
import { PAYMENTS } from '../api/endpoints'

export const paymentsService = {
  list: (params) => httpClient.get(PAYMENTS.LIST, { params }),
  get: (id) => httpClient.get(PAYMENTS.DETAIL(id)),
  create: (payload) => httpClient.post(PAYMENTS.CREATE, payload),
}
