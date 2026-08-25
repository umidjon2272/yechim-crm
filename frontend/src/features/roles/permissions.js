export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  INSTALLER: 'INSTALLER',
  DEVELOPER: 'DEVELOPER',
  PARTNER: 'PARTNER',
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
  PARTNER: 'Partner',
}

export const PERMISSION_SCHEMA = [
  { resource: 'customers', label: 'Mijozlar', section: 'CRM', actions: ['view', 'viewAll', 'viewOwn', 'viewGroups', 'create', 'edit', 'editCore', 'delete', 'viewPhone', 'viewAmount', 'viewPipelineTotal', 'viewDeposit', 'viewFinancials', 'viewCreatedBy', 'amount.view', 'deposit.view', 'phone.view'] },
  { resource: 'calls', label: "Qo'ng'iroqlar", section: 'Kommunikatsiya', actions: ['view', 'create'] },
  { resource: 'reminders', label: 'Eslatmalar', section: 'Kommunikatsiya', actions: ['view', 'viewAll', 'create', 'edit'] },
  { resource: 'tasks', label: 'Vazifalar', section: 'Vazifalar', actions: ['view', 'viewAll', 'create', 'edit', 'delete', 'assign'] },
  { resource: 'comments', label: 'Izohlar', section: 'Tarix', actions: ['view', 'create'] },
  { resource: 'activities', label: 'Activity / gaplashuv', section: 'Tarix', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'history', label: 'Customer timeline', section: 'Tarix', actions: ['view'] },
  { resource: 'employees', label: 'Xodimlar', section: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'programs', label: 'Dasturlar', section: 'Sozlamalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'settings', label: 'Sozlamalar / valyuta', section: 'Sozlamalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'teams', label: 'Jamoalar', section: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'businesses', label: 'Bizneslar', section: 'CRM', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'leads', label: 'Murojaatlar', section: 'CRM', actions: ['view', 'create', 'edit', 'delete', 'assign', 'convert'] },
  { resource: 'deals', label: 'Savdolar', section: 'CRM', actions: ['view', 'create', 'edit', 'delete', 'assign', 'changeStage'] },
  { resource: 'quotations', label: 'Takliflar', section: 'Savdo', actions: ['view', 'create', 'edit', 'delete', 'send'] },
  { resource: 'payments', label: "To'lovlar", section: 'Savdo', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'installations', label: "O'rnatishlar", section: 'Savdo', actions: ['view', 'viewAll', 'create', 'edit', 'delete', 'assign'] },
  { resource: 'attachments', label: 'Fayllar', section: 'Tarix', actions: ['create'] },
  { resource: 'dashboard', label: 'Dashboard', section: 'Sozlamalar', actions: ['view'] },
  { resource: 'profit', label: 'Foyda', section: 'Sozlamalar', actions: ['view'] },
  { resource: 'notifications', label: 'Bildirishnomalar', section: 'Sozlamalar', actions: ['view', 'manage'] },
  { resource: 'reports', label: 'Hisobotlar', section: 'Sozlamalar', actions: ['view'] },
]

export const ALL_PERMISSIONS = PERMISSION_SCHEMA.flatMap(({ resource, actions }) => actions.map((action) => `${resource}.${action}`))

export const ROLE_DEFAULT_PERMISSIONS = {
  ADMIN: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  PARTNER: ['customers.view'],
  EMPLOYEE: [
    'customers.view', 'customers.create', 'customers.edit',
    'customers.viewPhone', 'customers.viewAmount', 'customers.viewPipelineTotal', 'customers.viewDeposit', 'customers.viewFinancials',
    'calls.view', 'calls.create', 'reminders.view', 'reminders.create',
    'tasks.view', 'tasks.create', 'comments.view', 'comments.create',
    'activities.view', 'activities.create', 'history.view', 'programs.view',
  ],
  MANAGER: ['dashboard.view', 'profit.view', 'reports.view', 'customers.view', 'customers.create', 'customers.edit', 'businesses.view', 'businesses.create', 'businesses.edit', 'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert', 'deals.view', 'deals.create', 'deals.edit', 'deals.changeStage', 'deals.assign', 'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send', 'payments.view', 'payments.create', 'payments.edit', 'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.viewAll', 'activities.view', 'activities.create', 'activities.edit', 'installations.view', 'installations.create', 'installations.edit', 'installations.assign', 'attachments.create', 'comments.create', 'employees.view', 'teams.view', 'teams.edit', 'notifications.view', 'notifications.manage'],
  SALES: ['dashboard.view', 'customers.view', 'customers.create', 'customers.edit', 'businesses.view', 'businesses.create', 'businesses.edit', 'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert', 'deals.view', 'deals.create', 'deals.edit', 'deals.changeStage', 'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send', 'payments.view', 'tasks.view', 'activities.view', 'activities.create', 'attachments.create', 'comments.create', 'notifications.view'],
  SUPPORT: ['dashboard.view', 'customers.view', 'businesses.view', 'leads.view', 'leads.create', 'leads.edit', 'tasks.view', 'activities.view', 'activities.create', 'attachments.create', 'comments.create', 'notifications.view'],
  INSTALLER: ['dashboard.view', 'customers.view', 'installations.view', 'installations.edit', 'tasks.view', 'activities.view', 'activities.create', 'attachments.create', 'comments.create', 'notifications.view'],
  DEVELOPER: ['dashboard.view', 'reports.view', 'customers.view', 'businesses.view', 'leads.view', 'deals.view', 'quotations.view', 'payments.view', 'tasks.view', 'activities.view', 'installations.view', 'employees.view', 'teams.view', 'notifications.view', 'settings.view'],
}

export function can(user, permissionKey) {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey)
}
