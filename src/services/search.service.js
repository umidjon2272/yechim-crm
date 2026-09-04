import { httpClient } from '../api/httpClient'
import { SEARCH } from '../api/endpoints'

export const searchService = {
  global: (query, signal) => httpClient.get(SEARCH.GLOBAL, { params: { q: query }, signal }),
}
