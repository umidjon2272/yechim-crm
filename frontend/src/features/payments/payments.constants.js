export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER']

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Naqd',
  CARD: 'Karta',
  BANK_TRANSFER: 'Bank o‘tkazmasi',
  ONLINE: 'Onlayn',
  OTHER: 'Boshqa',
}

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED']

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'Kutilmoqda',
  PAID: 'To‘langan',
  PARTIAL: 'Qisman',
  FAILED: 'Muvaffaqiyatsiz',
  REFUNDED: 'Qaytarilgan',
}

export const PAYMENT_STATUS_BADGE_VARIANTS = {
  PENDING: 'gray',
  PAID: 'success',
  PARTIAL: 'warning',
  FAILED: 'danger',
  REFUNDED: 'info',
}
