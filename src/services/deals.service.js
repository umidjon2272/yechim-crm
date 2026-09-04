import { httpClient } from '../api/httpClient'
import { DEALS, QUOTATIONS, PAYMENTS, INSTALLATIONS, ACTIVITIES, TASKS } from '../api/endpoints'

export const dealsService = {
  list: (params) => httpClient.get(DEALS.LIST, { params }),
  get: (id) => httpClient.get(DEALS.DETAIL(id)),
  create: (payload) => httpClient.post(DEALS.CREATE, payload),
  update: (id, payload) => httpClient.patch(DEALS.UPDATE(id), payload),
  updateStage: (id, stage) => httpClient.patch(DEALS.UPDATE_STAGE(id), { stage }),

  // Deal Items sub-resource
  listItems: (dealId) => httpClient.get(DEALS.ITEMS(dealId)),
  addItem: (dealId, payload) => httpClient.post(DEALS.ITEMS(dealId), payload),
  updateItem: (dealId, itemId, payload) => httpClient.patch(DEALS.ITEM_DETAIL(dealId, itemId), payload),
  removeItem: (dealId, itemId) => httpClient.delete(DEALS.ITEM_DETAIL(dealId, itemId)),

  getQuotations: (id) => httpClient.get(QUOTATIONS.LIST, { params: { dealId: id } }),
  getPayments: (id) => httpClient.get(PAYMENTS.LIST, { params: { dealId: id } }),
  getInstallations: (id) => httpClient.get(INSTALLATIONS.LIST, { params: { dealId: id } }),
  getActivities: (id) => httpClient.get(ACTIVITIES.LIST, { params: { dealId: id } }),
  getTasks: (id) => httpClient.get(TASKS.LIST, { params: { dealId: id } }),
}
