export const LEAD_SOURCES = ['WEBSITE', 'TELEGRAM', 'INSTAGRAM', 'REFERRAL', 'CALL', 'ADVERTISEMENT', 'EXISTING_CUSTOMER', 'OTHER']

export const LEAD_SOURCE_LABELS = {
  WEBSITE: 'Veb-sayt',
  TELEGRAM: 'Telegram',
  INSTAGRAM: 'Instagram',
  REFERRAL: 'Tavsiya',
  CALL: 'Qo‘ng‘iroq',
  ADVERTISEMENT: 'Reklama',
  EXISTING_CUSTOMER: 'Mavjud mijoz',
  OTHER: 'Boshqa',
}

export const INTEREST_LEVELS = ['LOW', 'MEDIUM', 'HIGH']

export const INTEREST_LEVEL_LABELS = { LOW: 'Past', MEDIUM: 'O‘rtacha', HIGH: 'Yuqori' }

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO', 'QUOTATION', 'NEGOTIATION', 'WON', 'LOST']

export const LEAD_STATUS_LABELS = {
  NEW: 'Yangi',
  CONTACTED: 'Bog‘lanildi',
  QUALIFIED: 'Saralandi',
  DEMO: 'Demo',
  QUOTATION: 'Taklif',
  NEGOTIATION: 'Muzokara',
  WON: 'Yutildi',
  LOST: 'Yo‘qotildi',
}

export const LEAD_STATUS_BADGE_VARIANTS = {
  NEW: 'info',
  CONTACTED: 'primary',
  QUALIFIED: 'primary',
  DEMO: 'warning',
  QUOTATION: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
}

// Leads that have already reached a terminal or deal-bearing stage can't be
// converted again.
export const LEAD_CONVERTIBLE_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO', 'QUOTATION', 'NEGOTIATION']
