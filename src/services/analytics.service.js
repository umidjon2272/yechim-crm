import { httpClient } from '../api/httpClient'
import { ANALYTICS } from '../api/endpoints'

export const analyticsService = {
  getDashboardSummary: () => httpClient.get(ANALYTICS.DASHBOARD_SUMMARY),
  getLeadsByStatus: () => httpClient.get(ANALYTICS.LEADS_BY_STATUS),
  getDealsByStage: () => httpClient.get(ANALYTICS.DEALS_BY_STAGE),
  getRevenue: (params) => httpClient.get(ANALYTICS.REVENUE, { params }),
  getInstallationsByStatus: () => httpClient.get(ANALYTICS.INSTALLATIONS_BY_STATUS),
  getEmployeePerformance: (id) => httpClient.get(ANALYTICS.EMPLOYEE_PERFORMANCE(id)),
}
