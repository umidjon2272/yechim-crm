import { httpClient } from '../api/httpClient'
import { EMPLOYEES } from '../api/endpoints'

export const employeesService = {
  list: (params) => httpClient.get(EMPLOYEES.LIST, { params }),
  get: (id) => httpClient.get(EMPLOYEES.DETAIL(id)),
  create: (payload) => httpClient.post(EMPLOYEES.CREATE, payload),
  update: (id, payload) => httpClient.patch(EMPLOYEES.UPDATE(id), payload),
  updatePermissions: (id, permissions) => httpClient.patch(EMPLOYEES.PERMISSIONS(id), { permissions }),
  remove: (id) => httpClient.delete(EMPLOYEES.DELETE(id)),
  resetPassword: (id, password) => httpClient.post(EMPLOYEES.RESET_PASSWORD(id), { password }),
  updateCredentials: (id, payload) => httpClient.patch(EMPLOYEES.CREDENTIALS(id), payload),
  activate: (id) => httpClient.post(EMPLOYEES.ACTIVATE(id)),
  deactivate: (id) => httpClient.post(EMPLOYEES.DEACTIVATE(id)),

  // Phase 2 relationship data — endpoints don't exist on the backend yet,
  // wired here so the Employee detail page can call real service functions
  // and start working the moment these routes ship.
  getAssignedTasks: (id) => httpClient.get(EMPLOYEES.ASSIGNED_TASKS(id)),
  getAssignedLeads: (id) => httpClient.get(EMPLOYEES.ASSIGNED_LEADS(id)),
  getAssignedDeals: (id) => httpClient.get(EMPLOYEES.ASSIGNED_DEALS(id)),
  getAssignedInstallations: (id) => httpClient.get(EMPLOYEES.ASSIGNED_INSTALLATIONS(id)),
}
