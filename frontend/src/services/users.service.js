import { httpClient } from '../api/httpClient'
import { USERS } from '../api/endpoints'

export const usersService = {
  updateProfile: (payload) => httpClient.patch(USERS.ME, payload),
  updateLogin: (username) => httpClient.patch(USERS.ME_LOGIN, { username }),
}
