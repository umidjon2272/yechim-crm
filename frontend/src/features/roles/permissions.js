export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  INSTALLER: 'INSTALLER',
  DEVELOPER: 'DEVELOPER',
}

export const BUILT_IN_ROLES = [ROLES.ADMIN, ROLES.EMPLOYEE]

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super administrator',
  ADMIN: 'Administrator',
  EMPLOYEE: 'Xodim',
  MANAGER: 'Menejer',
  SALES: 'Sotuvchi',
  SUPPORT: "Qo'llab-quvvatlash",
  INSTALLER: "O'rnatuvchi",
  DEVELOPER: 'Dasturchi',
}

export const PERMISSION_SCHEMA = [
  { resource: 'customers', label: 'CRM', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'employees', label: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'tasks', label: 'Vazifalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'programs', label: 'Dasturlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'settings', label: 'Sozlamalar', actions: ['view', 'create', 'edit', 'delete'] },
]

export const ALL_PERMISSIONS = PERMISSION_SCHEMA.flatMap(({ resource, actions }) => actions.map((action) => `${resource}.${action}`))

export const ROLE_DEFAULT_PERMISSIONS = {
  ADMIN: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  EMPLOYEE: ['customers.view', 'customers.create', 'customers.edit', 'tasks.view', 'programs.view'],
}

export function can(user, permissionKey) {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey)
}
