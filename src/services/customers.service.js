import { httpClient } from '../api/httpClient'
import { CUSTOMERS, CUSTOMER_GROUPS, BUSINESS_TYPES, PARTNERS, CUSTOMER_FIELD_DEFS, PROGRAM_CATALOG, MESSAGES, BUSINESSES, LEADS, DEALS, PAYMENTS, INSTALLATIONS, ACTIVITIES, TASKS } from '../api/endpoints'

export const customersService = {
  list: (params) => httpClient.get(CUSTOMERS.LIST, { params, cacheTtlMs: 2000 }),
  get: (id) => httpClient.get(CUSTOMERS.DETAIL(id)),
  create: (payload) => httpClient.post(CUSTOMERS.CREATE, payload),
  update: (id, payload) => httpClient.patch(CUSTOMERS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(CUSTOMERS.DELETE(id)),
  deactivate: (id) => httpClient.post(CUSTOMERS.DEACTIVATE(id)),
  getFilterOptions: () => httpClient.get(CUSTOMERS.FILTER_OPTIONS),

  // Related records — plain list() calls filtered by customerId, not
  // separate nested endpoints, to keep the backend surface small.
  getBusinesses: (id) => httpClient.get(BUSINESSES.LIST, { params: { customerId: id } }),
  getLeads: (id) => httpClient.get(LEADS.LIST, { params: { customerId: id } }),
  getDeals: (id) => httpClient.get(DEALS.LIST, { params: { customerId: id } }),
  getPayments: (id) => httpClient.get(PAYMENTS.LIST, { params: { customerId: id } }),
  getInstallations: (id) => httpClient.get(INSTALLATIONS.LIST, { params: { customerId: id } }),
  getActivities: (id) => httpClient.get(ACTIVITIES.LIST, { params: { customerId: id } }),
  getTasks: (id) => httpClient.get(TASKS.LIST, { params: { customerId: id } }),

  // Programs (Dasturlar)
  getPrograms: (id) => httpClient.get(CUSTOMERS.PROGRAMS(id)),
  addProgram: (id, payload) => httpClient.post(CUSTOMERS.PROGRAMS(id), payload),
  updateProgram: (id, programId, payload) => httpClient.patch(CUSTOMERS.PROGRAM_UPDATE(id, programId), payload),
  removeProgram: (id, programId) => httpClient.delete(CUSTOMERS.PROGRAM_UPDATE(id, programId)),

  // Groups (guruhlar)
  setGroups: (id, groupIds) => httpClient.patch(CUSTOMERS.GROUPS_UPDATE(id), { groupIds }),
  bulkMove: (payload) => httpClient.post(CUSTOMERS.BULK_MOVE, payload),

  // Pipeline stage (Yangi -> Gaplashildi -> ... -> Tugallandi)
  listStages: (params) => httpClient.get(CUSTOMERS.STAGES, { params, cacheTtlMs: 300000 }),
  createStage: (payload) => httpClient.post(CUSTOMERS.STAGES, payload),
  updateStage: (id, payload) => httpClient.patch(CUSTOMERS.STAGE_DETAIL(id), payload),
  deleteStage: (id, payload) => httpClient.delete(CUSTOMERS.STAGE_DELETE(id), { body: payload }),
  setStage: (id, stage, payload = {}) => {
    const stageId = typeof stage === 'object' ? stage?.id || stage?.stageId || stage?.value : stage
    return httpClient.patch(CUSTOMERS.STAGE_UPDATE(id), { stage: stageId, ...payload })
  },
  reorderStages: (stageIds) => httpClient.patch(CUSTOMERS.STAGE_REORDER, { stageIds }),

  // Messages (Yozishmalar)
  getMessages: (id) => httpClient.get(MESSAGES.LIST, { params: { customerId: id } }),
  sendMessage: (id, text) => httpClient.post(MESSAGES.CREATE, { customerId: id, text }),
}

export const customerGroupsService = {
  list: (params) => httpClient.get(CUSTOMER_GROUPS.LIST, { params, cacheTtlMs: 300000 }),
  create: (payload) => httpClient.post(CUSTOMER_GROUPS.CREATE, payload),
  update: (id, payload) => httpClient.patch(CUSTOMER_GROUPS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(CUSTOMER_GROUPS.DELETE(id)),
  partnerSummary: (id, params) => httpClient.get(CUSTOMER_GROUPS.PARTNER_SUMMARY(id), { params }),
}

export const businessTypesService = {
  list: () => httpClient.get(BUSINESS_TYPES.LIST, { cacheTtlMs: 300000 }),
  create: (payload) => httpClient.post(BUSINESS_TYPES.CREATE, payload),
  remove: (id) => httpClient.delete(BUSINESS_TYPES.DELETE(id)),
}

export const partnersService = {
  myCustomers: (params) => httpClient.get(PARTNERS.ME_CUSTOMERS, { params }),
  myStatistics: (params) => httpClient.get(PARTNERS.ME_STATISTICS, { params }),
}

export const customerFieldDefsService = {
  list: (params) => httpClient.get(CUSTOMER_FIELD_DEFS.LIST, { params }),
  create: (payload) => httpClient.post(CUSTOMER_FIELD_DEFS.CREATE, payload),
  update: (id, payload) => httpClient.patch(CUSTOMER_FIELD_DEFS.UPDATE(id), payload),
  remove: (id) => httpClient.delete(CUSTOMER_FIELD_DEFS.DELETE(id)),
}

export const programCatalogService = {
  list: (params) => httpClient.get(PROGRAM_CATALOG.LIST, { params }),
  create: (payload) => httpClient.post(PROGRAM_CATALOG.CREATE, payload),
  update: (id, payload) => httpClient.patch(PROGRAM_CATALOG.UPDATE(id), payload),
  remove: (id) => httpClient.delete(PROGRAM_CATALOG.DELETE(id)),
}
