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
  { resource: 'customers', label: 'Mijozlar', section: 'CRM', actions: ['view', 'viewAll', 'create', 'edit', 'delete'] },
  { resource: 'calls', label: "Qo'ng'iroqlar", section: 'Kommunikatsiya', actions: ['view', 'create'] },
  { resource: 'reminders', label: 'Eslatmalar', section: 'Kommunikatsiya', actions: ['view', 'viewAll', 'create', 'edit'] },
  { resource: 'tasks', label: 'Vazifalar', section: 'Vazifalar', actions: ['view', 'viewAll', 'create', 'edit', 'delete'] },
  { resource: 'comments', label: 'Izohlar', section: 'Tarix', actions: ['view', 'create'] },
  { resource: 'activities', label: 'Activity / gaplashuv', section: 'Tarix', actions: ['view', 'create'] },
  { resource: 'history', label: 'Customer timeline', section: 'Tarix', actions: ['view'] },
  { resource: 'employees', label: 'Xodimlar', section: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'programs', label: 'Dasturlar', section: 'Sozlamalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'settings', label: 'Sozlamalar / valyuta', section: 'Sozlamalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'teams', label: 'Jamoalar', section: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'businesses', label: 'Bizneslar', section: 'CRM', actions: ['view', 'create', 'edit'] },
  { resource: 'leads', label: 'Murojaatlar', section: 'CRM', actions: ['view', 'create', 'edit', 'delete', 'convert'] },
  { resource: 'deals', label: 'Savdolar', section: 'CRM', actions: ['view', 'create', 'edit', 'changeStage'] },
  { resource: 'quotations', label: 'Takliflar', section: 'Savdo', actions: ['view', 'create', 'edit'] },
  { resource: 'payments', label: "To'lovlar", section: 'Savdo', actions: ['view', 'create'] },
  { resource: 'installations', label: "O'rnatishlar", section: 'Savdo', actions: ['view', 'viewAll', 'create', 'edit'] },
  { resource: 'attachments', label: 'Fayllar', section: 'Tarix', actions: ['create'] },
  { resource: 'dashboard', label: 'Dashboard', section: 'Sozlamalar', actions: ['view'] },
  { resource: 'profit', label: 'Foyda', section: 'Sozlamalar', actions: ['view'] },
]

export const ALL_PERMISSIONS = PERMISSION_SCHEMA.flatMap(({ resource, actions }) => actions.map((action) => `${resource}.${action}`))

export const ROLE_DEFAULT_PERMISSIONS = {
  ADMIN: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  EMPLOYEE: [
    'customers.view', 'customers.create', 'customers.edit',
    'calls.view', 'calls.create', 'reminders.view', 'reminders.create',
    'tasks.view', 'tasks.create', 'comments.view', 'comments.create',
    'activities.view', 'activities.create', 'history.view', 'programs.view',
  ],
}

export function can(user, permissionKey) {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey)
}
