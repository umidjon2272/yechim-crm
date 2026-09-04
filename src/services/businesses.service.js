import { httpClient } from '../api/httpClient'
import { BUSINESSES, LEADS, DEALS, PAYMENTS, INSTALLATIONS, ACTIVITIES } from '../api/endpoints'

export const businessesService = {
  list: (params) => httpClient.get(BUSINESSES.LIST, { params }),
  get: (id) => httpClient.get(BUSINESSES.DETAIL(id)),
  create: (payload) => httpClient.post(BUSINESSES.CREATE, payload),
  update: (id, payload) => httpClient.patch(BUSINESSES.UPDATE(id), payload),

  getLeads: (id) => httpClient.get(LEADS.LIST, { params: { businessId: id } }),
  getDeals: (id) => httpClient.get(DEALS.LIST, { params: { businessId: id } }),
  getProducts: (id) => httpClient.get(BUSINESSES.PRODUCTS(id)),
  getPayments: (id) => httpClient.get(PAYMENTS.LIST, { params: { businessId: id } }),
  getInstallations: (id) => httpClient.get(INSTALLATIONS.LIST, { params: { businessId: id } }),
  getActivities: (id) => httpClient.get(ACTIVITIES.LIST, { params: { businessId: id } }),
}
