export const DEAL_STAGES = ['NEW', 'QUALIFICATION', 'DEMO', 'QUOTATION', 'NEGOTIATION', 'WON', 'LOST']

export const DEAL_STAGE_LABELS = {
  NEW: 'Yangi',
  QUALIFICATION: 'Saralash',
  DEMO: 'Demo',
  QUOTATION: 'Taklif',
  NEGOTIATION: 'Muzokara',
  WON: 'Yutildi',
  LOST: 'Yo‘qotildi',
}

export const DEAL_STAGE_BADGE_VARIANTS = {
  NEW: 'info',
  QUALIFICATION: 'primary',
  DEMO: 'warning',
  QUOTATION: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
}

export const DEAL_KANBAN_COLUMNS = DEAL_STAGES.map((stage) => ({ id: stage, label: DEAL_STAGE_LABELS[stage] }))
