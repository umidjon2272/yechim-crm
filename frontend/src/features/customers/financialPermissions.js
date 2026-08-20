const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const LEGACY_FINANCIAL_PERMISSIONS = ['customers.viewAmount', 'customers.viewDeposit', 'customers.viewPipelineTotal', 'amount.view', 'deposit.view']

export function canViewCustomerFinancials(user) {
  if (!user || user.role === 'PARTNER') return false
  if (ADMIN_ROLES.has(user.role)) return true
  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  return permissions.includes('customers.viewFinancials') || LEGACY_FINANCIAL_PERMISSIONS.some((permission) => permissions.includes(permission))
}

export function canViewCustomerField(user, field) {
  if (!canViewCustomerFinancials(user)) return false
  if (ADMIN_ROLES.has(user?.role) || user?.permissions?.includes('customers.viewFinancials')) return true
  const permission = field === 'amount' ? 'customers.viewAmount' : field === 'deposit' ? 'customers.viewDeposit' : null
  return Boolean(permission && (user?.permissions?.includes(permission) || user?.permissions?.includes(`${field}.view`)))
}

export function canViewPipelineTotal(user) {
  if (!canViewCustomerFinancials(user)) return false
  return ADMIN_ROLES.has(user?.role) || user?.permissions?.includes('customers.viewFinancials') || user?.permissions?.includes('customers.viewPipelineTotal')
}
