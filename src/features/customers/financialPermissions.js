const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

function permissionsOf(user) {
  return Array.isArray(user?.permissions) ? user.permissions : []
}

export function canViewCustomerFinancials(user) {
  if (!user || user.role === 'PARTNER') return false
  return ADMIN_ROLES.has(user.role) || permissionsOf(user).includes('customers.viewFinancials')
}

export function canViewCustomerField(user, field) {
  if (!user || user.role === 'PARTNER') return false
  if (ADMIN_ROLES.has(user?.role) || permissionsOf(user).includes('customers.viewFinancials')) return true
  const permission = field === 'amount' ? 'customers.viewAmount' : field === 'deposit' ? 'customers.viewDeposit' : null
  const legacyPermission = field === 'amount' ? 'amount.view' : field === 'deposit' ? 'deposit.view' : null
  return Boolean(permission && (permissionsOf(user).includes(permission) || permissionsOf(user).includes(legacyPermission)))
}

export function canViewPipelineTotal(user) {
  if (!user || user.role === 'PARTNER') return false
  return ADMIN_ROLES.has(user?.role)
    || permissionsOf(user).includes('customers.viewFinancials')
    || permissionsOf(user).includes('customers.viewPipelineTotal')
}
