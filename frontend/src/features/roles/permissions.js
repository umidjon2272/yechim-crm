// Frontend permission architecture.
//
// IMPORTANT: this is a UI-only guard (show/hide elements, block route access
// for UX purposes). It is NOT a security boundary — the backend must enforce
// authorization on every request regardless of what the frontend renders.
//
// ROLES and PERMISSION_SCHEMA below describe *what roles/permissions can
// exist* — that's frontend domain/UI structure, not fabricated backend data.
// Which permissions a given logged-in user actually holds always comes from
// the backend via GET /auth/me (user.permissions: string[]).

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  INSTALLER: 'INSTALLER',
  DEVELOPER: 'DEVELOPER',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super administrator',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Menejer',
  [ROLES.SALES]: 'Sotuvchi',
  [ROLES.SUPPORT]: 'Qo‘llab-quvvatlash',
  [ROLES.INSTALLER]: 'O‘rnatuvchi',
  [ROLES.DEVELOPER]: 'Dasturchi',
}

// resource -> available actions. Matched against the Employee/Roles/
// Permissions spec's own permission matrix (module list + per-module
// actions). `attachments`/`comments` aren't in that matrix but stay —
// removing them would break the existing CommentsSection/AttachmentsSection
// `can('comments.create')`/`can('attachments.create')` checks. `tasks.viewAll`
// also stays beyond the matrix's literal list because "employee sees only
// own tasks, admin/manager sees all" needs a permission distinct from
// `tasks.view`.
export const PERMISSION_SCHEMA = [
  { resource: 'dashboard', label: 'Boshqaruv paneli', actions: ['view'] },
  { resource: 'customers', label: 'Mijozlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'businesses', label: 'Bizneslar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'leads', label: 'Murojaatlar', actions: ['view', 'create', 'edit', 'delete', 'assign', 'convert'] },
  { resource: 'deals', label: 'Savdolar', actions: ['view', 'create', 'edit', 'delete', 'changeStage', 'assign'] },
  { resource: 'quotations', label: 'Takliflar', actions: ['view', 'create', 'edit', 'delete', 'send'] },
  { resource: 'payments', label: 'To‘lovlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'tasks', label: 'Vazifalar', actions: ['view', 'create', 'edit', 'delete', 'assign', 'viewAll'] },
  { resource: 'activities', label: 'Faoliyatlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'installations', label: 'O‘rnatishlar', actions: ['view', 'create', 'edit', 'delete', 'assign'] },
  { resource: 'attachments', label: 'Biriktirilgan fayllar', actions: ['create'] },
  { resource: 'comments', label: 'Izohlar', actions: ['create'] },
  { resource: 'employees', label: 'Xodimlar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'teams', label: 'Jamoalar', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'notifications', label: 'Bildirishnomalar', actions: ['view', 'manage'] },
  { resource: 'reports', label: 'Hisobotlar', actions: ['view'] },
  { resource: 'profit', label: 'Foyda', actions: ['view'] },
  { resource: 'settings', label: 'Sozlamalar', actions: ['view', 'edit'] },
]

export const ALL_PERMISSIONS = PERMISSION_SCHEMA.flatMap(({ resource, actions }) =>
  actions.map((action) => `${resource}.${action}`)
)

// Starting checkbox state when a role is assigned/selected in the Employee
// form's permission editor — NOT enforced at runtime (an employee's actual
// rights always come from their own `permissions` array, which starts as a
// copy of these defaults and can then be customized per-employee). SUPER_ADMIN
// bypasses `can()` entirely (see below) so it has no entry here.
export const ROLE_DEFAULT_PERMISSIONS = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,
  [ROLES.MANAGER]: [
    'dashboard.view', 'profit.view', 'reports.view',
    'customers.view', 'customers.create', 'customers.edit',
    'businesses.view', 'businesses.create', 'businesses.edit',
    'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert',
    'deals.view', 'deals.create', 'deals.edit', 'deals.changeStage', 'deals.assign',
    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send',
    'payments.view', 'payments.create', 'payments.edit',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.viewAll',
    'activities.view', 'activities.create', 'activities.edit',
    'installations.view', 'installations.create', 'installations.edit', 'installations.assign',
    'attachments.create', 'comments.create',
    'employees.view', 'teams.view', 'teams.edit',
    'notifications.view', 'notifications.manage',
  ],
  [ROLES.SALES]: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit',
    'businesses.view', 'businesses.create', 'businesses.edit',
    'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert',
    'deals.view', 'deals.create', 'deals.edit', 'deals.changeStage',
    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.send',
    'payments.view',
    'tasks.view',
    'activities.view', 'activities.create',
    'attachments.create', 'comments.create',
    'notifications.view',
  ],
  [ROLES.SUPPORT]: [
    'dashboard.view',
    'customers.view',
    'businesses.view',
    'leads.view', 'leads.create', 'leads.edit',
    'tasks.view',
    'activities.view', 'activities.create',
    'attachments.create', 'comments.create',
    'notifications.view',
  ],
  [ROLES.INSTALLER]: [
    'dashboard.view',
    'customers.view',
    'installations.view', 'installations.edit',
    'tasks.view',
    'activities.view', 'activities.create',
    'attachments.create', 'comments.create',
    'notifications.view',
  ],
  [ROLES.DEVELOPER]: [
    'dashboard.view', 'reports.view',
    'customers.view', 'businesses.view', 'leads.view', 'deals.view',
    'quotations.view', 'payments.view', 'tasks.view', 'activities.view',
    'installations.view', 'employees.view', 'teams.view',
    'notifications.view', 'settings.view',
  ],
}

/**
 * can('employees.view') — checks the given permission key against the
 * current user's `permissions` array (as returned by the backend).
 */
export function can(user, permissionKey) {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey)
}
