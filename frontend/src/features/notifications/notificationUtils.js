export const ENTITY_ROUTES = {
  customer: '/admin/crm/customers',
  business: '/admin/crm/businesses',
  lead: '/admin/crm/leads',
  deal: '/admin/crm/deals',
  quotation: '/admin/crm/quotations',
  payment: '/admin/crm/payments',
  task: '/admin/tasks',
  installation: '/admin/crm/installations',
}

export function getNotificationHref(notification) {
  const basePath = ENTITY_ROUTES[notification?.entityType]
  if (!basePath) return null
  if (notification.entityType === 'task' || !notification.entityId) return basePath
  return `${basePath}/${notification.entityId}`
}
