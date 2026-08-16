// Centralized backend path constants. Services import from here instead of
// inlining URL strings, so the whole app has one place to update once the
// real backend contract is finalized.

export const AUTH = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
}

export const USERS = {
  ME: '/users/me',
}

export const EMPLOYEES = {
  LIST: '/employees',
  DETAIL: (id) => `/employees/${id}`,
  CREATE: '/employees',
  UPDATE: (id) => `/employees/${id}`,
  ACTIVATE: (id) => `/employees/${id}/activate`,
  DEACTIVATE: (id) => `/employees/${id}/deactivate`,
  ASSIGNED_TASKS: (id) => `/employees/${id}/tasks`,
  ASSIGNED_LEADS: (id) => `/employees/${id}/leads`,
  ASSIGNED_DEALS: (id) => `/employees/${id}/deals`,
  ASSIGNED_INSTALLATIONS: (id) => `/employees/${id}/installations`,
}

export const TEAMS = {
  LIST: '/teams',
  DETAIL: (id) => `/teams/${id}`,
  CREATE: '/teams',
  UPDATE: (id) => `/teams/${id}`,
  DELETE: (id) => `/teams/${id}`,
}

export const ROLES = {
  LIST: '/roles',
  DETAIL: (id) => `/roles/${id}`,
  CREATE: '/roles',
  UPDATE: (id) => `/roles/${id}`,
  DELETE: (id) => `/roles/${id}`,
  PERMISSIONS_SCHEMA: '/roles/permissions-schema',
}

// ---------------------------------------------------------------------------
// Phase 2 — CRM business flow: Customer -> Business -> Lead -> Deal ->
// Deal Items -> Quotation -> Payment -> Installation -> Activity/Task.
// ---------------------------------------------------------------------------

export const CUSTOMERS = {
  LIST: '/customers',
  DETAIL: (id) => `/customers/${id}`,
  CREATE: '/customers',
  UPDATE: (id) => `/customers/${id}`,
  DEACTIVATE: (id) => `/customers/${id}/deactivate`,
  // Distinct filter option sets (city, dastur/program) for the customer hub's
  // filter row — cheap to compute from existing records, no separate catalog.
  FILTER_OPTIONS: '/meta/customer-options',
  PROGRAMS: (id) => `/customers/${id}/programs`,
  PROGRAM_UPDATE: (id, programId) => `/customers/${id}/programs/${programId}`,
  GROUPS_UPDATE: (id) => `/customers/${id}/groups`,
  BULK_MOVE: '/customers/bulk-move',
  STAGE_UPDATE: (id) => `/customers/${id}/stage`,
  STAGES: '/meta/customer-stages',
  STAGE_DETAIL: (id) => `/meta/customer-stages/${id}`,
}

export const CUSTOMER_GROUPS = {
  LIST: '/customer-groups',
  DETAIL: (id) => `/customer-groups/${id}`,
  CREATE: '/customer-groups',
  UPDATE: (id) => `/customer-groups/${id}`,
  DELETE: (id) => `/customer-groups/${id}`,
}

export const CUSTOMER_FIELD_DEFS = {
  LIST: '/customer-field-defs',
  DETAIL: (id) => `/customer-field-defs/${id}`,
  CREATE: '/customer-field-defs',
  UPDATE: (id) => `/customer-field-defs/${id}`,
  DELETE: (id) => `/customer-field-defs/${id}`,
}

export const MESSAGES = {
  LIST: '/messages',
  CREATE: '/messages',
}

export const PROGRAM_CATALOG = {
  LIST: '/program-catalog',
  DETAIL: (id) => `/program-catalog/${id}`,
  CREATE: '/program-catalog',
  UPDATE: (id) => `/program-catalog/${id}`,
  DELETE: (id) => `/program-catalog/${id}`,
}

export const BUSINESSES = {
  LIST: '/businesses',
  DETAIL: (id) => `/businesses/${id}`,
  CREATE: '/businesses',
  UPDATE: (id) => `/businesses/${id}`,
  // Aggregate of deal-item products across all of this business's deals —
  // there's no standalone product catalog module in Phase 2, so this is the
  // one cross-deal aggregate endpoint the backend needs to provide.
  PRODUCTS: (id) => `/businesses/${id}/products`,
}

export const LEADS = {
  LIST: '/leads',
  DETAIL: (id) => `/leads/${id}`,
  CREATE: '/leads',
  UPDATE: (id) => `/leads/${id}`,
  DELETE: (id) => `/leads/${id}`,
  CONVERT_TO_DEAL: (id) => `/leads/${id}/convert-to-deal`,
}

export const DEALS = {
  LIST: '/deals',
  DETAIL: (id) => `/deals/${id}`,
  CREATE: '/deals',
  UPDATE: (id) => `/deals/${id}`,
  UPDATE_STAGE: (id) => `/deals/${id}/stage`,
  ITEMS: (dealId) => `/deals/${dealId}/items`,
  ITEM_DETAIL: (dealId, itemId) => `/deals/${dealId}/items/${itemId}`,
}

export const QUOTATIONS = {
  LIST: '/quotations',
  DETAIL: (id) => `/quotations/${id}`,
  CREATE: '/quotations',
  UPDATE: (id) => `/quotations/${id}`,
  SEND: (id) => `/quotations/${id}/send`,
  ACCEPT: (id) => `/quotations/${id}/accept`,
  REJECT: (id) => `/quotations/${id}/reject`,
}

export const PAYMENTS = {
  LIST: '/payments',
  DETAIL: (id) => `/payments/${id}`,
  CREATE: '/payments',
}

export const TASKS = {
  LIST: '/tasks',
  DETAIL: (id) => `/tasks/${id}`,
  CREATE: '/tasks',
  UPDATE: (id) => `/tasks/${id}`,
}

export const ACTIVITIES = {
  LIST: '/activities',
  DETAIL: (id) => `/activities/${id}`,
  CREATE: '/activities',
}

export const INSTALLATIONS = {
  LIST: '/installations',
  DETAIL: (id) => `/installations/${id}`,
  CREATE: '/installations',
  UPDATE: (id) => `/installations/${id}`,
}

// Generic — reusable across Customer/Business/Lead/Deal/Task/Installation
// (comments) and Customer/Business/Lead/Deal/Quotation/Installation
// (attachments) via ?entityType=&entityId= query params, so no per-entity
// endpoint duplication is needed.
export const COMMENTS = {
  LIST: '/comments',
  CREATE: '/comments',
  UPDATE: (id) => `/comments/${id}`,
  DELETE: (id) => `/comments/${id}`,
}

export const ATTACHMENTS = {
  LIST: '/attachments',
  UPLOAD: '/attachments',
  DELETE: (id) => `/attachments/${id}`,
}

export const NOTIFICATIONS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/mark-all-read',
}

export const SEARCH = {
  GLOBAL: '/search',
}

// Cross-entity, pre-sorted activity feed for a single Customer/Deal (Lead
// created, stage changes, quotation created, payment received, installation
// scheduled/completed, etc. — merged into one read-only history). New in
// Phase 3; not present in Phase 2's endpoint set.
export const TIMELINE = {
  GET: '/timeline',
}

export const ANALYTICS = {
  DASHBOARD_SUMMARY: '/analytics/dashboard-summary',
  LEADS_BY_STATUS: '/analytics/leads-by-status',
  DEALS_BY_STAGE: '/analytics/deals-by-stage',
  REVENUE: '/analytics/revenue',
  INSTALLATIONS_BY_STATUS: '/analytics/installations-by-status',
  // New in Phase 3 — per-employee rollup for EmployeeDetailPage's
  // performance card.
  EMPLOYEE_PERFORMANCE: (id) => `/analytics/employee-performance/${id}`,
}
