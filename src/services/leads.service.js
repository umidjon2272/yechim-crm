import { httpClient } from '../api/httpClient'
import { LEADS, ACTIVITIES, TASKS } from '../api/endpoints'

export const leadsService = {
  list: (params) => httpClient.get(LEADS.LIST, { params }),
  get: (id) => httpClient.get(LEADS.DETAIL(id)),
  create: (payload) => httpClient.post(LEADS.CREATE, payload),
  update: (id, payload) => httpClient.patch(LEADS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(LEADS.DELETE(id)),

  // `payload` carries the editable deal fields from the Convert to Deal
  // modal (name/expectedValue/assignedEmployeeId/productsNote) — the backend
  // still derives customer/business from the lead itself, never re-creating
  // them from frontend input.
  convertToDeal: (id, payload) => httpClient.post(LEADS.CONVERT_TO_DEAL(id), payload),

  getActivities: (id) => httpClient.get(ACTIVITIES.LIST, { params: { leadId: id } }),
  getTasks: (id) => httpClient.get(TASKS.LIST, { params: { leadId: id } }),
}
