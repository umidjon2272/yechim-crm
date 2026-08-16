/**
 * BOLD YECHIM CRM — in-browser demo data engine.
 *
 * Automatic fallback used by httpClient.js whenever no real backend is
 * reachable (no network path at all, or a static host answering with
 * something that isn't our JSON API — e.g. a platform 404 for an
 * undeployed /api route). It is NOT a replacement for a real backend: data
 * lives in this tab's localStorage, there's no real auth/security, and it
 * exists purely so the UI is fully clickable (create/edit/delete, with
 * relationships preserved) before a real backend is connected.
 *
 * Deliberately mirrors mock-server/app.js's routes, data shapes and
 * relationship logic almost 1:1 (same seed story, same paginate/
 * enrichReferences helpers) so switching a real backend back on later is a
 * drop-in swap — every service in src/services/ keeps calling the exact
 * same endpoint paths either way.
 */
import { ApiError } from './ApiError'

const DATA_KEY = 'bold-yechim-demo-data-v1'
const SESSION_KEY = 'bold-yechim-demo-session-v1'

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function hasStorage() {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function loadPersistedDb() {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(DATA_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let saveScheduled = false
function persistDb() {
  if (!hasStorage()) return
  // Batch bursts of mutations (e.g. seed()) into a single write.
  if (saveScheduled) return
  saveScheduled = true
  Promise.resolve().then(() => {
    saveScheduled = false
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(db))
    } catch {
      // Storage full/unavailable (private browsing) — demo continues
      // working for this tab, just won't survive a reload.
    }
  })
}

// ---------------------------------------------------------------------------
// In-memory data (hydrated from localStorage if present, else re-seeded)
// ---------------------------------------------------------------------------
const db = {
  users: [],
  teams: [],
  customers: [],
  customerStages: [],
  customerGroups: [],
  customerFieldDefs: [],
  programCatalog: [],
  messages: [],
  businesses: [],
  leads: [],
  deals: [],
  dealItems: [],
  quotations: [],
  payments: [],
  tasks: [],
  activities: [],
  installations: [],
  comments: [],
  attachments: [],
  notifications: [],
  roles: [],
}

const DEFAULT_CUSTOMER_STAGES = [
  { id: 'NEW', label: 'Yangi' },
  { id: 'CONTACTED', label: 'Gaplashilgan' },
  { id: 'IN_PROGRESS', label: 'Jarayonda' },
  { id: 'FOLLOW_UP', label: 'Qayta aloqaga chiqish' },
  { id: 'FUTURE_SALE', label: 'Keyinchalik sotuv' },
  { id: 'DEPOSIT_RECEIVED', label: 'Zaklad olingan' },
  { id: 'PAID', label: 'To‘lov qilindi' },
  { id: 'INSTALLATION_REQUIRED', label: 'O‘rnatish kerak' },
  { id: 'INSTALLED', label: 'O‘rnatib bo‘ldi' },
]

const LEGACY_CUSTOMER_STAGE_MAP = {
  ORDERED: 'DEPOSIT_RECEIVED',
  PAYMENT_PENDING: 'DEPOSIT_RECEIVED',
  INSTALLING: 'INSTALLATION_REQUIRED',
  DONE: 'INSTALLED',
}

function defaultCustomerStageId() {
  return db.customerStages.find((item) => item.label === 'Yangi')?.id || 'NEW'
}

function normalizeCustomerStage(stage) {
  const fallback = defaultCustomerStageId()
  const mapped = LEGACY_CUSTOMER_STAGE_MAP[stage] || stage || fallback
  return db.customerStages.some((item) => item.id === mapped) ? mapped : fallback
}

function normalizeCustomerAmount(amount) {
  if (amount === '' || amount == null) return 0
  const numeric = Number(amount)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function normalizeCustomerRecord(customer) {
  customer.stage = normalizeCustomerStage(customer.stage)
  customer.amount = normalizeCustomerAmount(customer.amount)
  customer.programs = Array.isArray(customer.programs)
    ? customer.programs.map((program) => ({
        id: program.id || uid(),
        version: '',
        startDate: '',
        installedDate: '',
        status: 'NEW',
        subscriptionUntil: '',
        notes: '',
        createdAt: program.createdAt || now(),
        ...program,
      }))
    : []
  return customer
}

// Uploaded file bytes never go through JSON/localStorage — kept in memory
// only (via an object URL) for the lifetime of this tab.
const attachmentBlobUrls = new Map() // attachmentId -> blob: URL

function seed() {
  const teamSales = { id: uid(), name: 'Sotuv', description: 'Sotuv bo‘limi', lead: null, status: 'active', membersCount: 2, members: [] }
  const teamInstall = { id: uid(), name: 'O‘rnatish', description: 'O‘rnatish bo‘limi', lead: null, status: 'active', membersCount: 1, members: [] }
  db.teams.push(teamSales, teamInstall)

  const admin = {
    id: uid(),
    name: 'Admin',
    email: 'admin@zenix.com',
    username: 'admin',
    password: 'admin123',
    phone: '+998901234567',
    role: 'SUPER_ADMIN',
    permissions: [],
    team: teamSales,
    status: 'active',
    createdAt: now(),
  }
  const sales = {
    id: uid(),
    name: 'Sardor Aliyev',
    email: 'sardor@zenix.com',
    username: 'sardor.sales',
    password: 'sardor123',
    phone: '+998901112233',
    role: 'SALES',
    permissions: [
      'dashboard.view',
      'customers.view', 'customers.create', 'customers.edit',
      'customer-groups.view', 'customer-groups.create', 'customer-groups.edit',
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
    team: teamSales,
    status: 'active',
    createdAt: now(),
  }
  const installer = {
    id: uid(),
    name: 'Javohir Karimov',
    email: 'javohir@zenix.com',
    username: 'javohir.install',
    password: 'javohir123',
    phone: '+998903334455',
    role: 'INSTALLER',
    permissions: [
      'dashboard.view', 'customers.view',
      'installations.view', 'installations.edit',
      'tasks.view',
      'activities.view', 'activities.create',
      'attachments.create', 'comments.create', 'notifications.view',
    ],
    team: teamInstall,
    status: 'active',
    createdAt: now(),
  }
  const manager = {
    id: uid(),
    name: 'Ali Nazarov',
    email: 'ali@zenix.com',
    username: 'ali.manager',
    password: 'ali12345',
    phone: '+998905556677',
    role: 'MANAGER',
    permissions: [
      'dashboard.view', 'profit.view', 'reports.view',
      'customers.view', 'customers.create', 'customers.edit',
      'customer-groups.view', 'customer-groups.create', 'customer-groups.edit',
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
    team: teamSales,
    status: 'active',
    createdAt: now(),
  }
  db.users.push(admin, sales, installer, manager)
  teamSales.lead = { id: sales.id, name: sales.name }
  teamSales.members = [{ id: admin.id, name: admin.name }, { id: sales.id, name: sales.name }]
  teamInstall.lead = { id: installer.id, name: installer.name }
  teamInstall.members = [{ id: installer.id, name: installer.name }]

  db.roles.push(
    { id: uid(), name: 'SUPER_ADMIN', permissions: [] },
    { id: uid(), name: 'MANAGER', permissions: manager.permissions },
    { id: uid(), name: 'SALES', permissions: sales.permissions },
    { id: uid(), name: 'INSTALLER', permissions: installer.permissions }
  )

  const programCreatedAt = now()
  const customerAli = {
    id: uid(),
    name: 'Ali Valiyev',
    phone: '+998901234500',
    phone2: '',
    telegram: '@ali_valiyev',
    email: 'ali.valiyev@example.com',
    address: { country: 'O‘zbekiston', region: 'Toshkent', city: 'Toshkent', district: 'Yunusobod', street: 'Amir Temur ko‘chasi', house: '12', extra: '' },
    birthDate: '',
    notes: 'VIP mijoz',
    telegramUsername: 'ali_valiyev',
    instagram: '',
    source: 'REFERRAL',
    customFields: {},
    programs: [
      { id: uid(), name: 'Bito POS', version: '2.4', startDate: '2026-08-01', installedDate: '2026-08-05', status: 'ACTIVE', subscriptionUntil: '2027-08-05', notes: '', createdAt: programCreatedAt },
    ],
    groupIds: [],
    assignedEmployee: { id: sales.id, name: sales.name },
    amount: 4500000,
    status: 'active',
    stage: 'INSTALLATION_REQUIRED',
    createdAt: now(),
  }
  const customerSardor = {
    id: uid(),
    name: 'Sardor Rahimov',
    phone: '+998907654321',
    phone2: '',
    telegram: '',
    email: 'sardor.rahimov@example.com',
    address: { country: 'O‘zbekiston', region: 'Toshkent', city: 'Toshkent', district: 'Chilonzor', street: '', house: '', extra: '' },
    birthDate: '',
    notes: '',
    telegramUsername: '',
    instagram: '',
    source: 'TELEGRAM',
    customFields: {},
    programs: [
      { id: uid(), name: 'Bito POS', version: '2.4', startDate: '2026-07-10', installedDate: '2026-07-12', status: 'ACTIVE', subscriptionUntil: '2027-07-12', notes: '', createdAt: programCreatedAt },
      { id: uid(), name: 'Bito Kassa', version: '1.2', startDate: '2026-07-10', installedDate: '', status: 'INSTALLING', subscriptionUntil: '', notes: 'O‘rnatish kutilmoqda', createdAt: programCreatedAt },
    ],
    groupIds: [],
    assignedEmployee: { id: sales.id, name: sales.name },
    amount: 0,
    status: 'active',
    stage: 'CONTACTED',
    createdAt: now(),
  }
  const customerJavohir = {
    id: uid(),
    name: 'Javohir Tosheva',
    phone: '+998909998877',
    phone2: '',
    telegram: '',
    email: 'javohir.t@example.com',
    address: { country: 'O‘zbekiston', region: 'Samarqand', city: 'Samarqand', district: '', street: '', house: '', extra: '' },
    birthDate: '',
    notes: '',
    telegramUsername: '',
    instagram: '',
    source: 'INSTAGRAM',
    customFields: {},
    programs: [
      { id: uid(), name: 'Bito Kassa', version: '1.2', startDate: '2026-06-01', installedDate: '2026-06-03', status: 'ACTIVE', subscriptionUntil: '2027-06-03', notes: '', createdAt: programCreatedAt },
    ],
    groupIds: [],
    assignedEmployee: { id: manager.id, name: manager.name },
    amount: 0,
    status: 'active',
    createdAt: now(),
  }
  db.customers.push(customerAli, customerSardor, customerJavohir)

  db.customerGroups.push(
    { id: uid(), name: 'VIP mijozlar', createdAt: now() },
    { id: uid(), name: 'Bito mijozlari', createdAt: now() }
  )
  customerAli.groupIds = [db.customerGroups[0].id, db.customerGroups[1].id]
  customerSardor.groupIds = [db.customerGroups[1].id]
  customerJavohir.groupIds = [db.customerGroups[1].id]

  db.customerFieldDefs.push({
    id: uid(),
    label: 'Qurilmalar soni',
    type: 'NUMBER',
    options: [],
    createdAt: now(),
  })

  db.programCatalog.push(
    { id: uid(), name: 'Bito', type: 'POS', version: '2.4', description: 'Restoran va do‘konlar uchun savdo nazorati dasturi', createdAt: now() },
    { id: uid(), name: 'Bito Kassa', type: 'Kassa', version: '1.2', description: 'Kassa apparati uchun dastur', createdAt: now() },
    { id: uid(), name: 'Bito CRM', type: 'CRM', version: '1.0', description: 'Mijozlar bilan ishlash tizimi', createdAt: now() },
    { id: uid(), name: 'Bito Ombor', type: 'Ombor', version: '1.0', description: 'Ombor va zaxira hisobi', createdAt: now() }
  )

  db.messages.push(
    { id: uid(), customerId: customerAli.id, senderType: 'employee', senderName: sales.name, text: 'Assalomu alaykum, Ali aka! Bito POS o‘rnatish bo‘yicha bog‘lanmoqchi edim.', createdAt: now() },
    { id: uid(), customerId: customerAli.id, senderType: 'customer', senderName: customerAli.name, text: 'Vaalaykum assalom, albatta, qachon kelasiz?', createdAt: now() },
    { id: uid(), customerId: customerAli.id, senderType: 'employee', senderName: sales.name, text: 'Ertaga soat 14:00 da boramiz, mos keladimi?', createdAt: now() },
    { id: uid(), customerId: customerAli.id, senderType: 'customer', senderName: customerAli.name, text: 'Ha, mos keladi. Kutamiz.', createdAt: now() }
  )

  const businessAli = {
    id: uid(),
    name: 'Ali Restaurant',
    businessType: 'Restoran',
    customer: { id: customerAli.id, name: customerAli.name },
    phone: '+998901234500',
    email: 'ali.valiyev@example.com',
    address: 'Amir Temur ko‘chasi 12',
    city: 'Toshkent',
    status: 'active',
    assignedEmployee: { id: sales.id, name: sales.name },
    notes: 'VIP mijoz',
    createdAt: now(),
  }
  const businessSardor = {
    id: uid(),
    name: 'Sardor Market',
    businessType: 'Do‘kon',
    customer: { id: customerSardor.id, name: customerSardor.name },
    phone: '+998907654321',
    email: 'sardor.rahimov@example.com',
    address: 'Chilonzor tumani, 5-kvartal',
    city: 'Toshkent',
    status: 'active',
    assignedEmployee: { id: sales.id, name: sales.name },
    notes: '',
    createdAt: now(),
  }
  const businessJavohir = {
    id: uid(),
    name: 'Javohir Store',
    businessType: 'Do‘kon',
    customer: { id: customerJavohir.id, name: customerJavohir.name },
    phone: '+998909998877',
    email: 'javohir.t@example.com',
    address: 'Yunusobod tumani, 8-uy',
    city: 'Samarqand',
    status: 'active',
    assignedEmployee: { id: manager.id, name: manager.name },
    notes: '',
    createdAt: now(),
  }
  db.businesses.push(businessAli, businessSardor, businessJavohir)
  customerAli.business = { id: businessAli.id, name: businessAli.name }
  customerSardor.business = { id: businessSardor.id, name: businessSardor.name }
  customerJavohir.business = { id: businessJavohir.id, name: businessJavohir.name }

  const leadAli = {
    id: uid(),
    title: 'POS tizimi uchun qiziqish',
    customer: { id: customerAli.id, name: customerAli.name },
    business: { id: businessAli.id, name: businessAli.name },
    source: 'INSTAGRAM',
    assignedEmployee: { id: sales.id, name: sales.name },
    interestLevel: 'HIGH',
    need: 'Restoran uchun zamonaviy POS kerak',
    interestedProduct: 'POS terminal',
    status: 'QUOTATION',
    expectedValue: 4500000,
    nextFollowUpDate: null,
    notes: '',
    dealId: null,
    createdAt: now(),
  }
  const leadSardor = {
    id: uid(),
    title: 'Kassa apparati so‘rovi',
    customer: { id: customerSardor.id, name: customerSardor.name },
    business: { id: businessSardor.id, name: businessSardor.name },
    source: 'TELEGRAM',
    assignedEmployee: { id: sales.id, name: sales.name },
    interestLevel: 'MEDIUM',
    need: 'Kichik do‘kon uchun kassa',
    interestedProduct: 'Kassa apparati',
    status: 'NEW',
    expectedValue: 1200000,
    nextFollowUpDate: null,
    notes: '',
    dealId: null,
    createdAt: now(),
  }
  db.leads.push(leadAli, leadSardor)

  const dealAli = {
    id: uid(),
    name: 'Ali Restaurant — POS o‘rnatish',
    customer: { id: customerAli.id, name: customerAli.name },
    business: { id: businessAli.id, name: businessAli.name },
    salesEmployee: { id: sales.id, name: sales.name },
    stage: 'QUOTATION',
    value: 4500000,
    paymentStatus: 'PARTIAL',
    installationStatus: 'PENDING',
    expectedCloseDate: null,
    createdAt: now(),
  }
  db.deals.push(dealAli)
  leadAli.dealId = dealAli.id
  leadAli.status = 'WON'

  const item1 = { id: uid(), dealId: dealAli.id, product: 'POS terminal (Android)', quantity: 2, unitPrice: 2000000, discount: 100000, total: 3900000, createdAt: now() }
  const item2 = { id: uid(), dealId: dealAli.id, product: 'Termal printer', quantity: 2, unitPrice: 300000, discount: 0, total: 600000, createdAt: now() }
  db.dealItems.push(item1, item2)

  const quotationAli = {
    id: uid(),
    number: '2026-0001',
    dealId: dealAli.id,
    deal: { id: dealAli.id, name: dealAli.name },
    customer: { id: customerAli.id, name: customerAli.name, phone: customerAli.phone, email: customerAli.email },
    business: { id: businessAli.id, name: businessAli.name, address: businessAli.address },
    total: 4500000,
    status: 'SENT',
    validUntil: null,
    notes: 'Yetkazib berish narxga kirmagan',
    createdAt: now(),
  }
  db.quotations.push(quotationAli)

  db.payments.push({
    id: uid(),
    dealId: dealAli.id,
    deal: { id: dealAli.id, name: dealAli.name },
    customer: { id: customerAli.id, name: customerAli.name },
    business: { id: businessAli.id, name: businessAli.name },
    amount: 2000000,
    method: 'CASH',
    status: 'PAID',
    date: now().slice(0, 10),
    notes: '',
    employee: { id: sales.id, name: sales.name },
    createdAt: now(),
  })

  db.tasks.push({
    id: uid(),
    title: 'Ali bilan taklif bo‘yicha bog‘lanish',
    description: 'Taklifnoma yuborilgan, javob kutilmoqda',
    assignedEmployee: { id: sales.id, name: sales.name },
    assignedEmployeeId: sales.id,
    customer: { id: customerAli.id, name: customerAli.name },
    deal: { id: dealAli.id, name: dealAli.name },
    dueDate: null,
    priority: 'HIGH',
    status: 'TODO',
    createdAt: now(),
  })

  db.activities.push({
    id: uid(),
    type: 'CALL',
    title: 'Birinchi qo‘ng‘iroq',
    description: 'Ehtiyojlar aniqlandi',
    employeeName: sales.name,
    customerId: customerAli.id,
    businessId: businessAli.id,
    leadId: leadAli.id,
    dealId: null,
    date: now(),
    duration: 12,
    result: 'Qiziqish yuqori',
    nextAction: 'Demo ko‘rsatish',
    createdAt: now(),
  })
  db.activities.push({
    id: uid(),
    type: 'DEMO',
    title: 'POS demo',
    description: 'Mahsulot imkoniyatlari ko‘rsatildi',
    employeeName: sales.name,
    customerId: customerAli.id,
    businessId: businessAli.id,
    leadId: leadAli.id,
    dealId: dealAli.id,
    date: now(),
    duration: 30,
    result: 'Mijoz mamnun',
    nextAction: 'Taklif yuborish',
    createdAt: now(),
  })

  db.installations.push({
    id: uid(),
    dealId: dealAli.id,
    deal: { id: dealAli.id, name: dealAli.name },
    dealItemId: item1.id,
    dealItem: { id: item1.id, product: item1.product },
    customer: { id: customerAli.id, name: customerAli.name },
    business: { id: businessAli.id, name: businessAli.name },
    assignedEmployee: { id: installer.id, name: installer.name },
    address: businessAli.address,
    scheduledDate: null,
    startedDate: null,
    completedDate: null,
    status: 'SCHEDULED',
    notes: '',
    createdAt: now(),
  })

  db.notifications.push({
    id: uid(),
    title: 'Yangi vazifa biriktirildi',
    message: '"Ali bilan taklif bo‘yicha bog‘lanish" sizga biriktirildi',
    type: 'task',
    read: false,
    relatedEntityType: 'task',
    relatedEntityId: null,
    createdAt: now(),
  })
  db.notifications.push({
    id: uid(),
    title: 'Savdo bosqichi o‘zgardi',
    message: `"${dealAli.name}" Taklif bosqichiga o‘tdi`,
    type: 'deal',
    read: false,
    relatedEntityType: 'deal',
    relatedEntityId: dealAli.id,
    createdAt: now(),
  })
}

// Upgrades customer records saved by an older version of this engine (flat
// `programs: string[]`, no address/phone2/telegram/customFields/groupIds) to
// the current shape — runs unconditionally so it's a no-op on already-fresh
// data and safe to re-run every load.
// Old status keys (from before the Yangi/O'rnatilmoqda/Faol/To'xtatilgan/
// Tugagan relabel) mapped onto their closest new equivalent.
const LEGACY_PROGRAM_STATUS_MAP = { PENDING: 'INSTALLING', CANCELLED: 'SUSPENDED' }

function migrateCustomers() {
  db.customers.forEach((c) => {
    if (!c.address) c.address = { country: '', region: '', city: '', district: '', street: '', house: '', extra: '', lat: '', lng: '' }
    if (c.address.lat === undefined) c.address.lat = ''
    if (c.address.lng === undefined) c.address.lng = ''
    if (c.phone2 === undefined) c.phone2 = ''
    if (c.telegram === undefined) c.telegram = ''
    if (c.birthDate === undefined) c.birthDate = ''
    if (c.telegramUsername === undefined) c.telegramUsername = ''
    if (c.instagram === undefined) c.instagram = ''
    if (c.source === undefined) c.source = ''
    if (c.customFields === undefined) c.customFields = {}
    if (c.groupIds === undefined) c.groupIds = []
    if (!c.stage) c.stage = 'NEW'
    if (c.amount === undefined || c.amount === null || c.amount === '') c.amount = customerDealAmount(c.id)
    c.amount = normalizeCustomerAmount(c.amount)
    if (!Array.isArray(c.programs)) c.programs = []
    c.programs = c.programs.map((p) => {
      const program =
        typeof p === 'string'
          ? { id: uid(), name: p, version: '', startDate: '', installedDate: '', status: 'ACTIVE', subscriptionUntil: '', notes: '', createdAt: c.createdAt || now() }
          : p
      if (LEGACY_PROGRAM_STATUS_MAP[program.status]) program.status = LEGACY_PROGRAM_STATUS_MAP[program.status]
      if (program.assignedEmployeeId === undefined) program.assignedEmployeeId = ''
      return program
    })
  })
}

function slugStageName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘'`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function makeCustomerStageId(name) {
  const base = slugStageName(name) || 'BOSQICH'
  let id = `CUSTOM_${base}`
  let suffix = 2
  while (db.customerStages.some((stage) => stage.id === id)) {
    id = `CUSTOM_${base}_${suffix}`
    suffix += 1
  }
  return id
}

function migrateCustomerStages() {
  if (!Array.isArray(db.customerStages)) db.customerStages = []
  const byId = new Map(db.customerStages.map((stage) => [stage.id, stage]))
  DEFAULT_CUSTOMER_STAGES.forEach((stage, index) => {
    if (byId.has(stage.id)) {
      const existing = byId.get(stage.id)
      Object.assign(existing, { label: existing.label || stage.label, order: existing.order ?? index, system: true })
    } else {
      db.customerStages.push({ ...stage, order: index - 0.1, system: true, createdAt: now() })
    }
  })
  db.customers.forEach((customer) => {
    customer.stage = LEGACY_CUSTOMER_STAGE_MAP[customer.stage] || customer.stage || 'NEW'
    if (customer.stage && !db.customerStages.some((stage) => stage.id === customer.stage)) {
      db.customerStages.push({ id: customer.stage, label: customer.stage, order: db.customerStages.length, system: false, createdAt: now() })
    }
  })
  reindexCustomerStages()
}

function customerStageLabel(stageId) {
  return db.customerStages.find((stage) => stage.id === stageId)?.label || stageId || ''
}

function orderedCustomerStages() {
  return [...db.customerStages].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
}

function reindexCustomerStages(stages = orderedCustomerStages()) {
  stages.forEach((stage, index) => {
    stage.order = index
  })
  db.customerStages = stages
}

const persisted = loadPersistedDb()
if (persisted) {
  Object.assign(db, persisted)
} else {
  seed()
  persistDb()
}
migrateCustomers()
migrateCustomerStages()
persistDb()

// ---------------------------------------------------------------------------
// Session (localStorage-backed, mirrors a cookie-based session for demo
// purposes only — never used for real authorization).
// ---------------------------------------------------------------------------
function readSession() {
  if (!hasStorage()) return undefined
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function writeSession(value) {
  if (!hasStorage()) return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function getCurrentUser() {
  let session = readSession()
  if (session === undefined) {
    // First-ever visit in this browser: auto-sign-in as the seeded admin so
    // the demo is immediately browsable, no login prompt required.
    const admin = db.users.find((u) => u.role === 'SUPER_ADMIN')
    session = admin ? { userId: admin.id } : null
    writeSession(session)
  }
  if (!session || !session.userId) return null
  return db.users.find((u) => u.id === session.userId) || null
}

function requireAuth() {
  const user = getCurrentUser()
  if (!user) throw new ApiError('Sessiya topilmadi. Iltimos qayta kiring.', { status: 401 })
  return user
}

function publicUser(user) {
  const { password, ...rest } = user
  return rest
}

// ---------------------------------------------------------------------------
// Shared helpers (ported from mock-server/app.js almost verbatim)
// ---------------------------------------------------------------------------
function paginate(list, query = {}, { searchFields = [], relationFields = [], filterFn, enrichFn, extraSearchText } = {}) {
  let result = [...list]

  relationFields.forEach((field) => {
    if (query[field]) result = result.filter((item) => String(resolveRelationId(item, field)) === String(query[field]))
  })

  if (query.status) result = result.filter((item) => item.status === query.status)
  if (query.source) result = result.filter((item) => item.source === query.source)
  if (query.method) result = result.filter((item) => item.method === query.method)
  if (query.type) result = result.filter((item) => item.type === query.type)
  if (query.stage) result = result.filter((item) => item.stage === query.stage)
  if (query.priority) result = result.filter((item) => item.priority === query.priority)

  // Extra resource-specific predicate (e.g. Customers' city/program filters,
  // which aren't plain own-field or relation-id matches) — kept optional so
  // every other registerResource() call is unaffected.
  if (typeof filterFn === 'function') result = result.filter((item) => filterFn(item, query))

  if (query.search) {
    const term = String(query.search).toLowerCase()
    result = result.filter((item) => {
      if (searchFields.some((field) => String(item[field] || '').toLowerCase().includes(term))) return true
      return typeof extraSearchText === 'function' && extraSearchText(item).toLowerCase().includes(term)
    })
  }

  if (String(query.assignedToMe) === 'true' && query.__currentUserId) {
    result = result.filter((item) => resolveAssignedEmployeeId(item) === query.__currentUserId)
  }

  if (query.sort) {
    const desc = String(query.sort).startsWith('-')
    const field = desc ? query.sort.slice(1) : query.sort
    result.sort((a, b) => {
      const av = a[field] ?? ''
      const bv = b[field] ?? ''
      if (av < bv) return desc ? 1 : -1
      if (av > bv) return desc ? -1 : 1
      return 0
    })
  }

  const total = result.length
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  let items = result.slice((page - 1) * pageSize, page * pageSize)
  if (typeof enrichFn === 'function') items = items.map(enrichFn)
  return { items, total, page, pageSize }
}

function resolveRelationId(item, field) {
  if (field === 'customerId') return item.customer?.id ?? item.customerId
  if (field === 'businessId') return item.business?.id ?? item.businessId
  if (field === 'dealId') return item.deal?.id ?? item.dealId
  if (field === 'leadId') return item.lead?.id ?? item.leadId
  if (field === 'installationId') return item.installation?.id ?? item.installationId
  if (field === 'salesEmployeeId' || field === 'assignedEmployeeId') return resolveAssignedEmployeeId(item)
  return item[field]
}

function resolveAssignedEmployeeId(item) {
  return item.assignedEmployeeId ?? item.assignedEmployee?.id ?? item.salesEmployee?.id ?? null
}

function enrichReferences(item) {
  if (item.customerId && !item.customer) {
    const c = db.customers.find((x) => x.id === item.customerId)
    if (c) item.customer = { id: c.id, name: c.name }
  }
  if (item.businessId && !item.business) {
    const b = db.businesses.find((x) => x.id === item.businessId)
    if (b) item.business = { id: b.id, name: b.name }
  }
  if (item.dealId && !item.deal) {
    const d = db.deals.find((x) => x.id === item.dealId)
    if (d) item.deal = { id: d.id, name: d.name, customer: d.customer, business: d.business }
  }
  // A record created from a deal (e.g. an Installation) only ever gets sent
  // dealId, never customerId/businessId directly — without this, it's
  // findable by dealId but invisible to customersService.getInstallations()/
  // businessesService.getInstallations() (relationFields match on
  // item.customer?.id / item.business?.id), which is exactly the "why isn't
  // the installation I just created showing up on the Customer page" bug.
  if (!item.customer && item.deal?.customer) item.customer = item.deal.customer
  if (!item.business && item.deal?.business) item.business = item.deal.business
  if (item.leadId && !item.lead) {
    const l = db.leads.find((x) => x.id === item.leadId)
    if (l) item.lead = { id: l.id, title: l.title }
  }
  if (item.dealItemId && !item.dealItem) {
    const di = db.dealItems.find((x) => x.id === item.dealItemId)
    if (di) item.dealItem = { id: di.id, product: di.product }
  }
  if (item.assignedEmployeeId && !item.assignedEmployee) {
    const e = db.users.find((x) => x.id === item.assignedEmployeeId)
    if (e) item.assignedEmployee = { id: e.id, name: e.name }
  }
  if (item.salesEmployeeId && !item.salesEmployee) {
    const e = db.users.find((x) => x.id === item.salesEmployeeId)
    if (e) item.salesEmployee = { id: e.id, name: e.name }
  }
  return item
}

function findOrThrow(list, id, label) {
  const item = list.find((x) => x.id === id)
  if (!item) throw new ApiError(`${label} topilmadi`, { status: 404 })
  return item
}

// ---------------------------------------------------------------------------
// Router — tiny Express-alike matcher (method + "/segment/:param" pattern)
// ---------------------------------------------------------------------------
const routes = []

function register(method, pattern, handler, { auth = true } = {}) {
  routes.push({ method, segments: pattern.split('/').filter(Boolean), handler, auth })
}
const get = (pattern, handler, opts) => register('GET', pattern, handler, opts)
const post = (pattern, handler, opts) => register('POST', pattern, handler, opts)
const patch = (pattern, handler, opts) => register('PATCH', pattern, handler, opts)
const del = (pattern, handler, opts) => register('DELETE', pattern, handler, opts)

function matchRoute(method, path) {
  const pathSegments = path.split('/').filter(Boolean)
  for (const route of routes) {
    if (route.method !== method || route.segments.length !== pathSegments.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < route.segments.length; i++) {
      const seg = route.segments[i]
      if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(pathSegments[i])
      else if (seg !== pathSegments[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
post('/auth/login', ({ body }) => {
  const { email, password } = body || {}
  const login = String(email || '').trim()
  const user = db.users.find((u) => (u.email === login || u.username === login) && u.password === password)
  if (!user) throw new ApiError('Email yoki parol noto‘g‘ri', { status: 401 })
  if (user.status === 'inactive') throw new ApiError('Bu xodim nofaol holatda', { status: 403 })
  writeSession({ userId: user.id })
  return publicUser(user)
}, { auth: false })

post('/auth/logout', () => {
  writeSession(null)
  return { ok: true }
}, { auth: false })

get('/auth/me', ({ user }) => publicUser(user))

patch('/users/me', ({ user, body }) => {
  const { currentPassword, newPassword, confirmPassword, ...profile } = body || {}
  Object.assign(user, profile)
  if (newPassword) {
    if (!currentPassword || user.password !== currentPassword) throw new ApiError('Joriy parol noto‘g‘ri', { status: 400 })
    if (String(newPassword).length < 6) throw new ApiError('Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak', { status: 400 })
    if (confirmPassword && newPassword !== confirmPassword) throw new ApiError('Yangi parol tasdiqlanmadi', { status: 400 })
    user.password = newPassword
  }
  persistDb()
  return publicUser(user)
})

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------
get('/employees', ({ query }) => paginate(db.users, query, {
  searchFields: ['name', 'email', 'username'],
  enrichFn: (user) => ({ ...publicUser(user), performance: employeePerformance(user.id) }),
}))
get('/employees/:id', ({ params }) => {
  const employee = findOrThrow(db.users, params.id, 'Xodim')
  return { ...publicUser(employee), performance: employeePerformance(employee.id) }
})
post('/employees', ({ body }) => {
  const employee = { id: uid(), status: 'active', createdAt: now(), permissions: [], ...body, password: body.password || 'changeme123' }
  db.users.push(employee)
  persistDb()
  return publicUser(employee)
})
patch('/employees/:id', ({ params, body }) => {
  const user = findOrThrow(db.users, params.id, 'Xodim')
  Object.assign(user, body)
  persistDb()
  return publicUser(user)
})
post('/employees/:id/activate', ({ params }) => {
  const user = findOrThrow(db.users, params.id, 'Xodim')
  user.status = 'active'
  persistDb()
  return publicUser(user)
})
post('/employees/:id/deactivate', ({ params }) => {
  const user = findOrThrow(db.users, params.id, 'Xodim')
  user.status = 'inactive'
  persistDb()
  return publicUser(user)
})
get('/employees/:id/tasks', ({ params }) => paginate(db.tasks.filter((t) => t.assignedEmployeeId === params.id), {}))
get('/employees/:id/leads', ({ params }) => paginate(db.leads.filter((l) => l.assignedEmployee?.id === params.id), {}))
get('/employees/:id/deals', ({ params }) => paginate(db.deals.filter((d) => d.salesEmployee?.id === params.id), {}))
get('/employees/:id/installations', ({ params }) => paginate(db.installations.filter((i) => i.assignedEmployee?.id === params.id), {}))

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
get('/teams', ({ query }) => paginate(db.teams, query, { searchFields: ['name'] }))
get('/teams/:id', ({ params }) => findOrThrow(db.teams, params.id, 'Jamoa'))
post('/teams', ({ body }) => {
  const team = { id: uid(), status: 'active', membersCount: 0, members: [], createdAt: now(), ...body }
  db.teams.push(team)
  persistDb()
  return team
})
patch('/teams/:id', ({ params, body }) => {
  const team = findOrThrow(db.teams, params.id, 'Jamoa')
  Object.assign(team, body)
  persistDb()
  return team
})
del('/teams/:id', ({ params }) => {
  const index = db.teams.findIndex((t) => t.id === params.id)
  if (index === -1) throw new ApiError('Jamoa topilmadi', { status: 404 })
  db.teams.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
get('/roles', ({ query }) => paginate(db.roles, query, { searchFields: ['name'] }))
get('/roles/permissions-schema', () => [])
get('/roles/:id', ({ params }) => findOrThrow(db.roles, params.id, 'Rol'))
post('/roles', ({ body }) => {
  const role = { id: uid(), permissions: [], createdAt: now(), ...body }
  db.roles.push(role)
  persistDb()
  return role
})
patch('/roles/:id', ({ params, body }) => {
  const role = findOrThrow(db.roles, params.id, 'Rol')
  Object.assign(role, body)
  persistDb()
  return role
})
del('/roles/:id', ({ params }) => {
  const index = db.roles.findIndex((r) => r.id === params.id)
  if (index === -1) throw new ApiError('Rol topilmadi', { status: 404 })
  db.roles.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Generic CRM resource registration
// ---------------------------------------------------------------------------
function registerResource(path, collection, { searchFields = ['name'], relationFields = [], defaultStatus = 'active', skipCreate = false } = {}) {
  get(`/${path}`, ({ query, user }) => paginate(collection, { ...query, __currentUserId: user.id }, { searchFields, relationFields }))
  get(`/${path}/:id`, ({ params }) => findOrThrow(collection, params.id, path))
  // skipCreate: true means this resource registers its own POST elsewhere
  // (quotations/payments/tasks/activities need bespoke defaults like an
  // auto-numbered `number` or `employeeName` from the session) — the first
  // registered handler for a given method+path wins, so this generic one
  // must not be registered at all for those, or it would silently shadow
  // the specialized one (exactly the bug this comment is here to prevent).
  if (!skipCreate) {
    post(`/${path}`, ({ body }) => {
      const item = enrichReferences({ id: uid(), status: body.status || defaultStatus, createdAt: now(), ...body })
      collection.push(item)
      persistDb()
      return item
    })
  }
  patch(`/${path}/:id`, ({ params, body }) => {
    const item = findOrThrow(collection, params.id, path)
    Object.assign(item, body, { updatedAt: now() })
    enrichReferences(item)
    if (path === 'customers') normalizeCustomerRecord(item)
    persistDb()
    return item
  })
}

// Bitrix-style customer hub: search/filter needs to reach across the
// customer's linked business (city) and deal items (which BOLD YECHIM
// product/"dastur" they use), not just the customer's own fields. Registered
// before registerResource('customers', ...) so this wins the first-match
// router (same shadowing pattern documented on registerResource above) —
// the generic GET it also registers is dead code, kept for readability.
function customerBusinesses(customerId) {
  return db.businesses.filter((b) => b.customer?.id === customerId)
}
function customerProgramNames(customerId) {
  const c = db.customers.find((x) => x.id === customerId)
  return Array.isArray(c?.programs) ? c.programs.map((p) => p.name) : []
}
function customerInstallations(customerId) {
  return db.installations.filter((i) => i.customer?.id === customerId)
}
// "Oxirgi aloqa" — most recent activity or message timestamp for this
// customer, used as a list-view column, not stored on the customer record
// itself (always derived, so it can't go stale independently).
function customerLastContactAt(customerId) {
  const dates = [
    ...db.activities.filter((a) => a.customerId === customerId).map((a) => a.date || a.createdAt),
    ...db.messages.filter((m) => m.customerId === customerId).map((m) => m.createdAt),
  ].filter(Boolean)
  return dates.length ? dates.sort().at(-1) : null
}
// Bosqichning o'zi (customer.stage) faqat pipeline yorlig'i — buyurtma/
// to'lov/o'rnatish holatini KO'RSATISH uchun esa mijozning eng so'nggi
// savdosi/to'lovi/o'rnatishidan hosila qiymat kerak (ro'yxat ustunlari,
// filter). Ikkalasi mustaqil: admin stage'ni istalgan vaqt qo'lda
// o'zgartira oladi, hosila qiymatlar esa haqiqiy yozuvlarni aks ettiradi.
function customerDeals(customerId) {
  return db.deals.filter((d) => d.customer?.id === customerId)
}
function customerDealAmount(customerId) {
  return customerDeals(customerId).reduce((sum, deal) => sum + Number(deal.value || 0), 0)
}
function employeePerformance(employeeId) {
  const customers = db.customers.filter((c) => c.assignedEmployee?.id === employeeId)
  const deals = db.deals.filter((d) => d.salesEmployee?.id === employeeId)
  const revenue = customers.reduce((sum, customer) => sum + customerDealAmount(customer.id), 0)
  const tasksCompleted = db.tasks.filter((t) => t.assignedEmployeeId === employeeId && t.status === 'COMPLETED').length
  const tasksInProgress = db.tasks.filter((t) => t.assignedEmployeeId === employeeId && t.status === 'IN_PROGRESS').length
  const installationsCompleted = db.installations.filter((i) => i.assignedEmployee?.id === employeeId && i.status === 'COMPLETED').length
  const activeTasks = db.tasks.filter((t) => t.assignedEmployeeId === employeeId && !['COMPLETED', 'CANCELLED'].includes(t.status)).length
  const stageCounts = DEFAULT_CUSTOMER_STAGES.reduce((acc, stage) => ({ ...acc, [stage.id]: 0 }), {})
  customers.forEach((customer) => {
    const stage = LEGACY_CUSTOMER_STAGE_MAP[customer.stage] || customer.stage || 'NEW'
    stageCounts[stage] = (stageCounts[stage] || 0) + 1
  })
  return {
    customers: customers.length,
    stageCounts,
    stageStats: DEFAULT_CUSTOMER_STAGES.map((stage) => ({ id: stage.id, label: stage.label, count: stageCounts[stage.id] || 0 })),
    deals: deals.length,
    wonDeals: deals.filter((d) => d.stage === 'WON').length,
    revenue,
    tasksCompleted,
    tasksInProgress,
    activeTasks,
    installationsCompleted,
  }
}
// Kept in sync with features/customers/customers.constants.js's
// CUSTOMER_STAGE_LABELS by hand — small, stable list, not worth importing
// a frontend feature module into the API layer for.
const STAGE_LABELS_FOR_SEARCH = {
  NEW: 'Yangi',
  CONTACTED: 'Gaplashilgan',
  IN_PROGRESS: 'Jarayonda',
  FOLLOW_UP: 'Qayta aloqaga chiqish',
  DEPOSIT_RECEIVED: 'Zaklad olingan',
  PAID: 'To‘lov qilindi',
  INSTALLATION_REQUIRED: 'O‘rnatish kerak',
  INSTALLED: 'O‘rnatib bo‘ldi',
}
function customerPaymentStatus(customerId) {
  const dealIds = customerDeals(customerId).map((d) => d.id)
  const payments = db.payments.filter((p) => dealIds.includes(p.dealId))
  if (payments.length === 0) return null
  return payments.some((p) => p.status === 'PAID') ? 'PAID' : payments.some((p) => p.status === 'PARTIAL') ? 'PARTIAL' : 'PENDING'
}
function customerInstallationStatus(customerId) {
  const list = customerInstallations(customerId)
  if (list.length === 0) return null
  return list[list.length - 1].status
}

get('/customers', ({ query, user }) => {
  return paginate(db.customers, { ...query, __currentUserId: user.id }, {
    searchFields: ['name', 'phone', 'email', 'phone2', 'telegram'],
    relationFields: ['assignedEmployeeId'],
    filterFn: (item, q) => {
      if (q.city && !customerBusinesses(item.id).some((b) => b.city === q.city)) return false
      if (q.program && !customerProgramNames(item.id).includes(q.program)) return false
      if (q.groupId && !(item.groupIds || []).includes(q.groupId)) return false
      if (q.installationStatus && !customerInstallations(item.id).some((i) => i.status === q.installationStatus)) return false
      if (q.stage && item.stage !== q.stage) return false
      if (q.createdFrom && item.createdAt < q.createdFrom) return false
      if (q.createdTo && item.createdAt > `${q.createdTo}T23:59:59.999Z`) return false
      return true
    },
    extraSearchText: (item) => {
      const businesses = customerBusinesses(item.id)
      return [
        ...businesses.map((b) => b.name),
        ...businesses.map((b) => b.city),
        ...customerProgramNames(item.id),
        customerStageLabel(item.stage) || STAGE_LABELS_FOR_SEARCH[item.stage] || '',
      ].join(' ')
    },
    enrichFn: (item) => ({
      ...item,
      lastContactAt: customerLastContactAt(item.id),
      paymentStatus: customerPaymentStatus(item.id),
      installationStatus: customerInstallationStatus(item.id),
      dealAmount: customerDealAmount(item.id),
    }),
  })
})
get('/meta/customer-options', () => {
  const stageCounts = {}
  db.customers.forEach((c) => {
    const stage = normalizeCustomerStage(c.stage)
    stageCounts[stage] = (stageCounts[stage] || 0) + 1
  })
  return {
    cities: [...new Set(db.businesses.map((b) => b.city).filter(Boolean))].sort(),
    programs: [...new Set(db.customers.flatMap((c) => (c.programs || []).map((p) => p.name)))].sort(),
    stageCounts,
  }
})
get('/meta/customer-stages', () => ({
  items: orderedCustomerStages(),
  total: db.customerStages.length,
}))
post('/meta/customer-stages', ({ body }) => {
  const label = String(body?.name || body?.label || '').trim()
  if (!label) throw new ApiError('Bosqich nomi kiritilishi shart', { status: 400 })
  if (db.customerStages.some((stage) => stage.label.toLowerCase() === label.toLowerCase())) {
    throw new ApiError('Bunday bosqich mavjud', { status: 400 })
  }
  const ordered = orderedCustomerStages()
  const afterIndex = body?.afterStageId ? ordered.findIndex((item) => item.id === body.afterStageId) : ordered.length - 1
  const insertIndex = afterIndex >= 0 ? afterIndex + 1 : ordered.length
  const stage = { id: makeCustomerStageId(label), label, order: insertIndex, system: false, createdAt: now() }
  ordered.splice(insertIndex, 0, stage)
  reindexCustomerStages(ordered)
  persistDb()
  return stage
})
patch('/meta/customer-stages/:id', ({ params, body }) => {
  const stage = findOrThrow(db.customerStages, params.id, 'Bosqich')
  const label = String(body?.name || body?.label || stage.label).trim()
  if (!label) throw new ApiError('Bosqich nomi kiritilishi shart', { status: 400 })
  if (db.customerStages.some((item) => item.id !== stage.id && item.label.toLowerCase() === label.toLowerCase())) {
    throw new ApiError('Bunday bosqich mavjud', { status: 400 })
  }
  stage.label = label

  if (body?.direction === 'left' || body?.direction === 'right') {
    const ordered = orderedCustomerStages()
    const index = ordered.findIndex((item) => item.id === stage.id)
    const targetIndex = body.direction === 'left' ? index - 1 : index + 1
    if (index >= 0 && targetIndex >= 0 && targetIndex < ordered.length) {
      ordered.splice(index, 1)
      ordered.splice(targetIndex, 0, stage)
      reindexCustomerStages(ordered)
    }
  } else if (body?.order !== undefined) {
    const ordered = orderedCustomerStages().filter((item) => item.id !== stage.id)
    const targetIndex = Math.max(0, Math.min(Number(body.order) || 0, ordered.length))
    ordered.splice(targetIndex, 0, stage)
    reindexCustomerStages(ordered)
  }

  persistDb()
  return stage
})
del('/meta/customer-stages/:id', ({ params, body }) => {
  const index = db.customerStages.findIndex((stage) => stage.id === params.id)
  if (index === -1) throw new ApiError('Bosqich topilmadi', { status: 404 })
  if (db.customerStages.length <= 1) throw new ApiError('Kamida bitta bosqich qolishi kerak', { status: 400 })
  const affected = db.customers.filter((customer) => customer.stage === params.id)
  if (affected.length > 0) {
    const replacementStageId = body?.replacementStageId
    if (!replacementStageId || replacementStageId === params.id || !db.customerStages.some((stage) => stage.id === replacementStageId)) {
      throw new ApiError('Mijozlarni kochirish uchun boshqa bosqich tanlang', { status: 400, details: { count: affected.length } })
    }
    affected.forEach((customer) => {
      customer.stage = replacementStageId
    })
  }
  db.customerStages.splice(index, 1)
  reindexCustomerStages()
  persistDb()
  return null
})
patch('/customers/:id/stage', ({ params, body }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  customer.stage = normalizeCustomerStage(body.stage)
  persistDb()
  return customer
})

// New customers must start on the pipeline (stage: 'NEW') — the generic
// registerResource POST only defaults `status`, not this second, unrelated
// status field, so a bespoke create (skipCreate on the resource below,
// same shadowing pattern used elsewhere in this file) is needed here too.
post('/customers/bulk-move', ({ body }) => {
  const ids = Array.isArray(body?.customerIds) ? body.customerIds : []
  const stage = body?.stage ? normalizeCustomerStage(body.stage) : null
  const targetGroupId = body?.targetGroupId || ''
  const fromGroupId = body?.fromGroupId || ''
  if (targetGroupId && !db.customerGroups.some((group) => group.id === targetGroupId)) {
    throw new ApiError('Guruh topilmadi', { status: 400 })
  }
  const updated = []
  ids.forEach((id) => {
    const customer = db.customers.find((item) => item.id === id)
    if (!customer) return
    if (stage) customer.stage = stage
    const groupIds = new Set(customer.groupIds || [])
    if (fromGroupId && fromGroupId !== targetGroupId) groupIds.delete(fromGroupId)
    if (targetGroupId) groupIds.add(targetGroupId)
    customer.groupIds = [...groupIds]
    updated.push(customer)
  })
  persistDb()
  return { items: updated, total: updated.length }
})
post('/customers', ({ body }) => {
  const customer = enrichReferences({ id: uid(), status: body.status || 'active', stage: body.stage || defaultCustomerStageId(), amount: 0, createdAt: now(), ...body })
  normalizeCustomerRecord(customer)
  db.customers.push(customer)
  persistDb()
  return customer
})
registerResource('customers', db.customers, { searchFields: ['name', 'phone', 'email'], skipCreate: true })
post('/customers/:id/deactivate', ({ params }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  customer.status = customer.status === 'active' ? 'inactive' : 'active'
  persistDb()
  return customer
})

// ---------------------------------------------------------------------------
// Customer programs (Dasturlar) — structured sub-records, not just names, so
// version/dates/status/subscription/notes can be tracked per install.
// ---------------------------------------------------------------------------
get('/customers/:id/programs', ({ params }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  return { items: customer.programs || [], total: (customer.programs || []).length }
})
post('/customers/:id/programs', ({ params, body }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  const program = { id: uid(), version: '', startDate: '', installedDate: '', status: 'ACTIVE', subscriptionUntil: '', notes: '', ...body, createdAt: now() }
  customer.programs = [...(customer.programs || []), program]
  persistDb()
  return program
})
patch('/customers/:id/programs/:programId', ({ params, body }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  const program = (customer.programs || []).find((p) => p.id === params.programId)
  if (!program) throw new ApiError('Dastur topilmadi', { status: 404 })
  Object.assign(program, body)
  persistDb()
  return program
})
del('/customers/:id/programs/:programId', ({ params }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  customer.programs = (customer.programs || []).filter((p) => p.id !== params.programId)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Customer groups (papka-style tags, many-to-many via customer.groupIds)
// ---------------------------------------------------------------------------
registerResource('customer-groups', db.customerGroups, { searchFields: ['name'] })
del('/customer-groups/:id', ({ params }) => {
  const index = db.customerGroups.findIndex((g) => g.id === params.id)
  if (index === -1) throw new ApiError('Guruh topilmadi', { status: 404 })
  db.customerGroups.splice(index, 1)
  db.customers.forEach((c) => {
    if (c.groupIds?.includes(params.id)) c.groupIds = c.groupIds.filter((id) => id !== params.id)
  })
  persistDb()
  return null
})
patch('/customers/:id/groups', ({ params, body }) => {
  const customer = findOrThrow(db.customers, params.id, 'Mijoz')
  customer.groupIds = Array.isArray(body.groupIds) ? body.groupIds : customer.groupIds
  persistDb()
  return customer
})

// ---------------------------------------------------------------------------
// Customer field definitions (admin-defined custom fields) — Sozlamalar →
// "Mijoz maydonlari". Values live on customer.customFields[fieldDefId].
// ---------------------------------------------------------------------------
registerResource('customer-field-defs', db.customerFieldDefs, { searchFields: ['label'] })
del('/customer-field-defs/:id', ({ params }) => {
  const index = db.customerFieldDefs.findIndex((f) => f.id === params.id)
  if (index === -1) throw new ApiError('Maydon topilmadi', { status: 404 })
  db.customerFieldDefs.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Program catalog (admin-defined, Sozlamalar → "Dasturlar") — the list a
// customer's "+ Dastur qo'shish" select reads from, so adding a new program
// here is the only thing needed to make it available everywhere, no
// frontend redeploy.
// ---------------------------------------------------------------------------
registerResource('program-catalog', db.programCatalog, { searchFields: ['name', 'type'] })
del('/program-catalog/:id', ({ params }) => {
  const index = db.programCatalog.findIndex((p) => p.id === params.id)
  if (index === -1) throw new ApiError('Dastur topilmadi', { status: 404 })
  db.programCatalog.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Messages (Yozishmalar) — frontend demo conversation, same entityId
// convention as comments/attachments so a real messenger backend is a
// drop-in swap later.
// ---------------------------------------------------------------------------
get('/messages', ({ query }) => {
  const items = db.messages.filter((m) => m.customerId === query.customerId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  return { items, total: items.length }
})
post('/messages', ({ body, user }) => {
  const message = { id: uid(), senderType: 'employee', senderName: user.name, createdAt: now(), ...body }
  db.messages.push(message)
  persistDb()
  return message
})

registerResource('businesses', db.businesses, { searchFields: ['name', 'city'], relationFields: ['customerId'] })
get('/businesses/:id/products', ({ params }) => {
  const items = db.dealItems.filter((item) => {
    const deal = db.deals.find((d) => d.id === item.dealId)
    return deal?.business?.id === params.id
  })
  return { items, total: items.length }
})

registerResource('leads', db.leads, { searchFields: ['title'], relationFields: ['customerId', 'businessId'] })
del('/leads/:id', ({ params }) => {
  const index = db.leads.findIndex((l) => l.id === params.id)
  if (index === -1) throw new ApiError('Murojaat topilmadi', { status: 404 })
  db.leads.splice(index, 1)
  persistDb()
  return null
})
post('/leads/:id/convert-to-deal', ({ params, body }) => {
  const lead = findOrThrow(db.leads, params.id, 'Murojaat')
  const { name, value, salesEmployeeId, productsNote } = body || {}
  const salesEmployee = salesEmployeeId ? db.users.find((u) => u.id === salesEmployeeId) : lead.assignedEmployee
  const deal = {
    id: uid(),
    name: name || lead.title,
    customer: lead.customer,
    business: lead.business,
    salesEmployee: salesEmployee ? { id: salesEmployee.id, name: salesEmployee.name } : lead.assignedEmployee,
    stage: 'NEW',
    value: value != null ? value : lead.expectedValue,
    productsNote: productsNote || lead.interestedProduct || '',
    paymentStatus: 'PENDING',
    installationStatus: 'PENDING',
    expectedCloseDate: null,
    createdAt: now(),
  }
  db.deals.push(deal)
  lead.dealId = deal.id
  lead.status = 'WON'
  persistDb()
  return { id: deal.id, dealId: deal.id }
})

registerResource('deals', db.deals, { searchFields: ['name'], relationFields: ['customerId', 'businessId', 'salesEmployeeId'] })
patch('/deals/:id/stage', ({ params, body }) => {
  const deal = findOrThrow(db.deals, params.id, 'Savdo')
  deal.stage = body.stage
  persistDb()
  return deal
})
// Keeps deal.value in sync with the sum of its items whenever items exist —
// so a deal built up via "+ Buyurtma" (no value set at creation) shows a
// real total everywhere that reads deal.value (workspace summary tile,
// PaymentForm's qolgan/remaining calc), not just inside DealItemsEditor's
// own client-side sum.
function syncDealValue(dealId) {
  const deal = db.deals.find((d) => d.id === dealId)
  const items = db.dealItems.filter((item) => item.dealId === dealId)
  if (deal && items.length > 0) {
    deal.value = items.reduce((sum, item) => sum + Number(item.total || 0), 0)
  }
}

get('/deals/:dealId/items', ({ params }) => {
  const items = db.dealItems.filter((item) => item.dealId === params.dealId)
  return { items, total: items.length }
})
post('/deals/:dealId/items', ({ params, body }) => {
  const item = {
    id: uid(),
    dealId: params.dealId,
    createdAt: now(),
    ...body,
    total: Math.max(0, Number(body.quantity || 0) * Number(body.unitPrice || 0) - Number(body.discount || 0)),
  }
  db.dealItems.push(item)
  syncDealValue(params.dealId)
  persistDb()
  return item
})
patch('/deals/:dealId/items/:itemId', ({ params, body }) => {
  const item = findOrThrow(db.dealItems, params.itemId, 'Mahsulot')
  Object.assign(item, body)
  item.total = Math.max(0, Number(item.quantity || 0) * Number(item.unitPrice || 0) - Number(item.discount || 0))
  syncDealValue(params.dealId)
  persistDb()
  return item
})
del('/deals/:dealId/items/:itemId', ({ params }) => {
  const index = db.dealItems.findIndex((i) => i.id === params.itemId)
  if (index === -1) throw new ApiError('Mahsulot topilmadi', { status: 404 })
  db.dealItems.splice(index, 1)
  syncDealValue(params.dealId)
  persistDb()
  return null
})

registerResource('quotations', db.quotations, { searchFields: ['number'], relationFields: ['dealId'], skipCreate: true })
post('/quotations', ({ body }) => {
  const deal = db.deals.find((d) => d.id === body.dealId)
  const quotation = {
    id: uid(),
    number: `2026-${String(db.quotations.length + 1).padStart(4, '0')}`,
    dealId: body.dealId,
    deal: deal ? { id: deal.id, name: deal.name } : null,
    customer: deal?.customer ?? null,
    business: deal?.business ?? null,
    total: deal?.value ?? 0,
    status: 'DRAFT',
    createdAt: now(),
    ...body,
  }
  db.quotations.push(quotation)
  persistDb()
  return quotation
})
function transitionQuotation(id, status) {
  const quotation = findOrThrow(db.quotations, id, 'Taklifnoma')
  quotation.status = status
  persistDb()
  return quotation
}
post('/quotations/:id/send', ({ params }) => transitionQuotation(params.id, 'SENT'))
post('/quotations/:id/accept', ({ params }) => transitionQuotation(params.id, 'ACCEPTED'))
post('/quotations/:id/reject', ({ params }) => transitionQuotation(params.id, 'REJECTED'))

registerResource('payments', db.payments, { searchFields: [], relationFields: ['customerId', 'businessId', 'dealId'], skipCreate: true })
post('/payments', ({ body, user }) => {
  const deal = db.deals.find((d) => d.id === body.dealId)
  const payment = {
    id: uid(),
    createdAt: now(),
    deal: deal ? { id: deal.id, name: deal.name } : null,
    customer: deal?.customer ?? null,
    business: deal?.business ?? null,
    employee: { id: user.id, name: user.name },
    ...body,
  }
  db.payments.push(payment)
  persistDb()
  return payment
})

registerResource('tasks', db.tasks, { searchFields: ['title'], relationFields: ['customerId', 'businessId', 'leadId', 'dealId', 'installationId'], skipCreate: true })
post('/tasks', ({ body, user }) => {
  const task = enrichReferences({ id: uid(), status: 'TODO', assignedEmployeeId: user.id, createdAt: now(), ...body })
  db.tasks.push(task)
  persistDb()
  return task
})

registerResource('activities', db.activities, { searchFields: ['title'], relationFields: ['customerId', 'businessId', 'leadId', 'dealId', 'installationId'], skipCreate: true })
post('/activities', ({ body, user }) => {
  const activity = enrichReferences({ id: uid(), employeeName: user.name, createdAt: now(), date: body.date || now(), ...body })
  db.activities.push(activity)
  persistDb()
  return activity
})

registerResource('installations', db.installations, {
  searchFields: [],
  relationFields: ['customerId', 'businessId', 'dealId', 'assignedEmployeeId'],
  defaultStatus: 'PENDING',
})

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
get('/comments', ({ query }) => {
  const { entityType, entityId } = query
  const items = db.comments.filter((c) => c.entityType === entityType && c.entityId === entityId)
  return { items, total: items.length }
})
post('/comments', ({ body, user }) => {
  const comment = { id: uid(), author: { id: user.id, name: user.name, avatarUrl: user.avatarUrl }, createdAt: now(), ...body }
  db.comments.push(comment)
  persistDb()
  return comment
})
patch('/comments/:id', ({ params, body }) => {
  const comment = findOrThrow(db.comments, params.id, 'Izoh')
  Object.assign(comment, body)
  persistDb()
  return comment
})
del('/comments/:id', ({ params }) => {
  const index = db.comments.findIndex((c) => c.id === params.id)
  if (index === -1) throw new ApiError('Izoh topilmadi', { status: 404 })
  db.comments.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Attachments — real in-browser file storage via object URLs (bytes are not
// persisted to localStorage; metadata is, so the list survives a reload but
// download links only work for the current tab session).
// ---------------------------------------------------------------------------
get('/attachments', ({ query }) => {
  const { entityType, entityId } = query
  const items = db.attachments.filter((a) => a.entityType === entityType && a.entityId === entityId)
  return { items, total: items.length }
})
post('/attachments', ({ body, user }) => {
  const file = body instanceof FormData ? body.get('file') : null
  if (!file) throw new ApiError('Fayl topilmadi', { status: 400 })
  const id = uid()
  const blobUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : ''
  attachmentBlobUrls.set(id, blobUrl)
  const attachment = {
    id,
    entityType: body.get('entityType'),
    entityId: body.get('entityId'),
    name: file.name,
    size: file.size,
    uploadedBy: { id: user.id, name: user.name },
    url: blobUrl,
    createdAt: now(),
  }
  db.attachments.push(attachment)
  persistDb()
  return attachment
})
del('/attachments/:id', ({ params }) => {
  const index = db.attachments.findIndex((a) => a.id === params.id)
  if (index === -1) throw new ApiError('Fayl topilmadi', { status: 404 })
  const blobUrl = attachmentBlobUrls.get(params.id)
  if (blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) URL.revokeObjectURL(blobUrl)
  attachmentBlobUrls.delete(params.id)
  db.attachments.splice(index, 1)
  persistDb()
  return null
})

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
get('/notifications', ({ query }) => paginate(db.notifications, query))
get('/notifications/unread-count', () => ({ count: db.notifications.filter((n) => !n.read).length }))
post('/notifications/:id/read', ({ params }) => {
  const notification = findOrThrow(db.notifications, params.id, 'Bildirishnoma')
  notification.read = true
  persistDb()
  return notification
})
post('/notifications/mark-all-read', () => {
  db.notifications.forEach((n) => (n.read = true))
  persistDb()
  return { ok: true }
})

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
get('/timeline', ({ query }) => {
  const { entityType, entityId } = query
  const events = []

  const addLead = (l) => events.push({ id: `lead-${l.id}`, type: 'LEAD_CREATED', date: l.createdAt, title: l.title, employeeName: l.assignedEmployee?.name })
  const addDeal = (d) =>
    events.push({ id: `deal-${d.id}`, type: 'STAGE_CHANGED', date: d.createdAt, title: `${d.name} — ${d.stage}`, employeeName: d.salesEmployee?.name })
  const addQuotation = (q) => events.push({ id: `quote-${q.id}`, type: 'QUOTATION_CREATED', date: q.createdAt, title: `Taklifnoma #${q.number}` })
  // `date`/`completedDate` are user-facing, date-only fields (no time-of-day),
  // so they're kept for display, but ordering uses `sortDate` — the record's
  // actual full createdAt/updatedAt timestamp — otherwise a same-day payment
  // or install-completion sorts to midnight and jumps ahead of same-day
  // events that DO carry a real time (e.g. "mijoz yaratildi").
  const addPayment = (p) =>
    events.push({ id: `pay-${p.id}`, type: 'PAYMENT_RECEIVED', date: p.date || p.createdAt, sortDate: p.createdAt, title: `${p.amount} (${p.method})`, employeeName: p.employee?.name })
  const addInstallation = (i) => {
    events.push({ id: `inst-sched-${i.id}`, type: 'INSTALLATION_SCHEDULED', date: i.createdAt, title: i.address, employeeName: i.assignedEmployee?.name })
    if (i.completedDate)
      events.push({ id: `inst-done-${i.id}`, type: 'INSTALLATION_COMPLETED', date: i.completedDate, sortDate: i.updatedAt || i.completedDate, title: i.address })
  }
  const addActivity = (a) => events.push({ id: `act-${a.id}`, type: a.type, date: a.date, title: a.title, description: a.description, employeeName: a.employeeName })
  const addCompletedTask = (t) => {
    if (t.status === 'COMPLETED') events.push({ id: `task-${t.id}`, type: 'TASK_COMPLETED', date: t.createdAt, title: t.title })
  }
  const addProgram = (customerId, p) =>
    events.push({ id: `program-${p.id}`, type: 'PROGRAM_ADDED', date: p.createdAt, title: `${p.name} dasturi qo‘shildi` })

  if (entityType === 'customer') {
    const customer = db.customers.find((c) => c.id === entityId)
    const leads = db.leads.filter((l) => l.customer?.id === entityId)
    const deals = db.deals.filter((d) => d.customer?.id === entityId)
    const dealIds = deals.map((d) => d.id)
    if (customer) {
      events.push({ id: `customer-${customer.id}`, type: 'CUSTOMER_CREATED', date: customer.createdAt, title: `${customer.name} mijoz sifatida yaratildi` })
      ;(customer.programs || []).forEach((p) => addProgram(customer.id, p))
    }
    leads.forEach(addLead)
    deals.forEach(addDeal)
    db.quotations.filter((q) => dealIds.includes(q.dealId)).forEach(addQuotation)
    db.payments.filter((p) => dealIds.includes(p.dealId)).forEach(addPayment)
    db.installations.filter((i) => i.customer?.id === entityId || dealIds.includes(i.dealId)).forEach(addInstallation)
    db.activities.filter((a) => a.customerId === entityId).forEach(addActivity)
    db.tasks.filter((t) => t.customer?.id === entityId).forEach(addCompletedTask)
  } else if (entityType === 'deal') {
    const deal = db.deals.find((d) => d.id === entityId)
    if (deal) addDeal(deal)
    db.quotations.filter((q) => q.dealId === entityId).forEach(addQuotation)
    db.payments.filter((p) => p.dealId === entityId).forEach(addPayment)
    db.installations.filter((i) => i.dealId === entityId).forEach(addInstallation)
    db.activities.filter((a) => a.dealId === entityId).forEach(addActivity)
    db.tasks.filter((t) => t.deal?.id === entityId).forEach(addCompletedTask)
  }

  events.sort((a, b) => new Date(a.sortDate || a.date || 0) - new Date(b.sortDate || b.date || 0))
  return { items: events }
})

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------
get('/search', ({ query }) => {
  const term = String(query.q || '').toLowerCase()
  if (!term) return { items: [] }
  const items = [
    ...db.customers.filter((c) => c.name.toLowerCase().includes(term)).map((c) => ({ type: 'customer', id: c.id, label: c.name })),
    ...db.businesses.filter((b) => b.name.toLowerCase().includes(term)).map((b) => ({ type: 'business', id: b.id, label: b.name })),
    ...db.leads.filter((l) => l.title.toLowerCase().includes(term)).map((l) => ({ type: 'lead', id: l.id, label: l.title })),
    ...db.deals.filter((d) => d.name.toLowerCase().includes(term)).map((d) => ({ type: 'deal', id: d.id, label: d.name })),
  ]
  return { items }
})

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
get('/analytics/dashboard-summary', () => ({
  totalLeads: db.leads.length,
  activeDeals: db.deals.filter((d) => !['WON', 'LOST'].includes(d.stage)).length,
  wonDeals: db.deals.filter((d) => d.stage === 'WON').length,
  revenue: db.payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount || 0), 0),
  pendingPayments: db.payments.filter((p) => p.status === 'PENDING').length,
  installations: db.installations.length,
  tasks: db.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
}))
get('/analytics/leads-by-status', () => {
  const counts = {}
  db.leads.forEach((l) => (counts[l.status] = (counts[l.status] || 0) + 1))
  return Object.entries(counts).map(([status, count]) => ({ status, count }))
})
get('/analytics/deals-by-stage', () => {
  const counts = {}
  db.deals.forEach((d) => (counts[d.stage] = (counts[d.stage] || 0) + 1))
  return Object.entries(counts).map(([stage, count]) => ({ stage, count }))
})
get('/analytics/revenue', () => [
  { period: 'Shu oy', amount: db.payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount || 0), 0) },
])
get('/analytics/installations-by-status', () => {
  const counts = {}
  db.installations.forEach((i) => (counts[i.status] = (counts[i.status] || 0) + 1))
  return Object.entries(counts).map(([status, count]) => ({ status, count }))
})
get('/analytics/employee-performance/:id', ({ params }) => {
  return employeePerformance(params.id)
})

// ---------------------------------------------------------------------------
// Entry point used by httpClient.js
// ---------------------------------------------------------------------------
export function handleDemoRequest({ method, path, body, params }) {
  const match = matchRoute(method, path)
  if (!match) {
    throw new ApiError(`Demo rejimida bu so‘rov qo‘llab-quvvatlanmaydi: ${method} ${path}`, { status: 404 })
  }
  const user = match.route.auth ? requireAuth() : getCurrentUser()
  const result = match.route.handler({ params: match.params, query: params || {}, body, user })
  return result === undefined ? null : result
}

export function isDemoSessionInitialized() {
  return readSession() !== undefined
}
