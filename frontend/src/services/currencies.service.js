import { httpClient } from '../api/httpClient'
import { CURRENCIES } from '../api/endpoints'

export const currenciesService = {
  list: () => httpClient.get(CURRENCIES.LIST),
  create: (payload) => httpClient.post(CURRENCIES.CREATE, payload),
  update: (id, payload) => httpClient.patch(CURRENCIES.UPDATE(id), payload),
}
