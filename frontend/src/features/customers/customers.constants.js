export const CUSTOMER_STATUSES = ['active', 'inactive']

export const CUSTOMER_STATUS_LABELS = {
  active: 'Faol',
  inactive: 'Nofaol',
}

// Mijoz bilan ishlash jarayoni (Bitrix-style pipeline) — customer.status
// (active/inactive) dan alohida: bu mijozning savdo jarayonidagi bosqichi,
// u esa hisobning faollik holati.
export const CUSTOMER_STAGES = [
  'NEW',
  'CONTACTED',
  'IN_PROGRESS',
  'FOLLOW_UP',
  'FUTURE_SALE',
  'DEPOSIT_RECEIVED',
  'PAID',
  'INSTALLATION_REQUIRED',
  'INSTALLED',
]

export const CUSTOMER_STAGE_LABELS = {
  NEW: 'Yangi',
  CONTACTED: 'Gaplashilgan',
  IN_PROGRESS: 'Jarayonda',
  FOLLOW_UP: 'Qayta aloqaga chiqish',
  FUTURE_SALE: 'Keyinchalik sotuv',
  DEPOSIT_RECEIVED: 'Zaklad olingan',
  PAID: 'To‘lov qilindi',
  INSTALLATION_REQUIRED: 'O‘rnatish kerak',
  INSTALLED: 'O‘rnatib bo‘ldi',
}

export const CUSTOMER_STAGE_BADGE_VARIANTS = {
  NEW: 'gray',
  CONTACTED: 'info',
  IN_PROGRESS: 'info',
  FOLLOW_UP: 'warning',
  FUTURE_SALE: 'gray',
  DEPOSIT_RECEIVED: 'warning',
  PAID: 'primary',
  INSTALLATION_REQUIRED: 'warning',
  INSTALLED: 'success',
}

export const PROGRAM_STATUSES = ['NEW', 'INSTALLING', 'ACTIVE', 'SUSPENDED', 'EXPIRED']

export const PROGRAM_STATUS_LABELS = {
  NEW: 'Yangi',
  INSTALLING: 'O‘rnatilmoqda',
  ACTIVE: 'Faol',
  SUSPENDED: 'To‘xtatilgan',
  EXPIRED: 'Tugagan',
}

export const PROGRAM_STATUS_BADGE_VARIANTS = {
  NEW: 'info',
  INSTALLING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'gray',
  EXPIRED: 'danger',
}

export const CUSTOM_FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'PHONE', 'ADDRESS']

export const CUSTOM_FIELD_TYPE_LABELS = {
  TEXT: 'Matn',
  NUMBER: 'Raqam',
  DATE: 'Sana',
  SELECT: 'Tanlash',
  BOOLEAN: 'Ha/Yo‘q',
  PHONE: 'Telefon',
  ADDRESS: 'Manzil',
}
