import './CustomerKanbanCard.scss'
import { formatCustomerCurrencyAmount, getCustomerAmount } from '../customerAmount'
import { formatCustomerBusinessTypes } from '../businessTypes'

export { getCustomerAmount }

function partnerProgressLabel(customer) {
  if (customer.isCompleted) return 'Yakunlangan'
  if (customer.stage === 'NEW') return 'Yangi'
  return 'Jarayonda'
}

function shortAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address
  return [address.city, address.district, address.street, address.house].filter(Boolean).join(', ')
}

function formatCardDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function cardSummary(customer) {
  const reminder = customer.nextReminder
  const reminderAt = reminder?.remindAt || customer.nextContactAt
  if (reminderAt && new Date(reminderAt).getTime() < Date.now()) return { label: 'Kechikkan eslatma', detail: reminder?.note || reminder?.title, date: formatCardDate(reminderAt), overdue: true }
  if (reminderAt && new Date(reminderAt).toDateString() === new Date().toDateString()) return { label: reminder?.title || 'Bugungi aloqa', detail: reminder?.note, date: formatCardDate(reminderAt) }
  if (customer.latestNote?.message) return { label: 'Oxirgi izoh', detail: customer.latestNote.message }
  if (customer.service || customer.programs?.[0]?.name) return { label: 'Dastur/xizmat', detail: customer.service || customer.programs[0].name }
  const address = shortAddress(customer.address)
  return address ? { label: 'Manzil', detail: address } : null
}

export function CustomerKanbanCard({ customer, selected = false, onSelect, onOpen, onQuickAction, partner = false, stageLabel, canViewAmount = true }) {
  const primaryProgram = customer.service || customer.programs?.[0]?.name
  const businessTypeLabel = formatCustomerBusinessTypes(customer, 1)
  const amount = getCustomerAmount(customer)
  const summary = cardSummary(customer)
  const lastContact = customer.lastContact
  const lastContactVisible = customer.lastContactVisible !== false
  const initials = customer.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'M'

  return (
    <div
      className="customer-kanban-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(customer.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(customer.id)
      }}
    >
      {onSelect && (
        <span className="customer-kanban-card__select" onClick={(event) => event.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={(event) => onSelect(customer.id, event.target.checked)} aria-label={`${customer.name} tanlash`} />
        </span>
      )}
      <span className="customer-kanban-card__top">
        <span className="customer-kanban-card__avatar">{initials}</span>
        <span className="customer-kanban-card__identity">
          <span className="customer-kanban-card__name">{customer.name}</span>
          {customer.phone && <span className="customer-kanban-card__product">{customer.phone}</span>}
        </span>
      </span>
      {partner ? (
        <>
          <span className="customer-kanban-card__stage">{stageLabel || customer.stageLabel || customer.stage}</span>
          <span className="customer-kanban-card__stage">{partnerProgressLabel(customer)}</span>
          <span className="customer-kanban-card__stage">{customer.isInstalled ? 'O‘rnatildi' : 'O‘rnatilmadi'}</span>
          <span className="customer-kanban-card__stage">Mukofot: ${Number(customer.rewardAmount || 0).toLocaleString('en-US')}</span>
        </>
      ) : (
        <>
          {(businessTypeLabel || customer.createdBy?.name || lastContactVisible) && <div className="customer-kanban-card__details">
            {businessTypeLabel && <div className="customer-kanban-card__detail">
              <span className="customer-kanban-card__detail-label">Biznes turi</span>
              <span className="customer-kanban-card__detail-value" title={formatCustomerBusinessTypes(customer)}>{businessTypeLabel}</span>
            </div>}
            {customer.createdBy?.name && <div className="customer-kanban-card__detail">
              <span className="customer-kanban-card__detail-label">Qo‘shgan</span>
              <span className="customer-kanban-card__detail-value">{customer.createdBy.name}</span>
            </div>}
            {lastContactVisible && <div className="customer-kanban-card__detail">
              <span className="customer-kanban-card__detail-label">Oxirgi aloqa</span>
              <span className="customer-kanban-card__detail-value">
                {lastContact ? `${formatCardDate(lastContact.at)}${lastContact.user?.name ? ` · ${lastContact.user.name}` : ''}` : 'Hali aloqa qilinmagan'}
              </span>
            </div>}
          </div>}
          {primaryProgram && <span className="customer-kanban-card__service">{primaryProgram}</span>}
          {canViewAmount && amount > 0 && <span className="customer-kanban-card__amount">{formatCustomerCurrencyAmount(amount, customer.currency)}</span>}
          {summary && <span className={summary.overdue ? 'customer-kanban-card__summary customer-kanban-card__summary--overdue' : 'customer-kanban-card__summary'}><strong>{summary.label}</strong>{summary.detail && <span>{summary.detail}</span>}{summary.date && <time>{summary.date}</time>}</span>}
          {false && (customer.isFollowUpToday || customer.isFollowUpOverdue) && (
            <span className={customer.isFollowUpOverdue ? 'customer-kanban-card__follow-up customer-kanban-card__follow-up--overdue' : 'customer-kanban-card__follow-up'}>
              {customer.isFollowUpOverdue ? '⚠ Aloqa kechikdi' : 'Bugun'}
            </span>
          )}
          {customer.nextContactAt && !customer.isFollowUpOverdue && !customer.isFollowUpToday && <span className="customer-kanban-card__contact">⏰ {new Date(customer.nextContactAt).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          {customer.stageDurationDays > 0 && <span className={customer.isStageStale ? 'customer-kanban-card__stage-duration customer-kanban-card__stage-duration--stale' : 'customer-kanban-card__stage-duration'}>{customer.isStageStale ? `${customer.stageDurationDays} kundan beri harakat yo'q` : `${stageLabel || customer.stageLabel || customer.stage}: ${customer.stageDurationDays} kun`}</span>}
          {customer.assignedEmployee?.name && <span className="customer-kanban-card__footer">
            <span className="customer-kanban-card__assignee-dot" aria-hidden="true" />
            <span className="customer-kanban-card__assignee">{customer.assignedEmployee.name}</span>
          </span>}
          {onQuickAction && <span className="customer-kanban-card__quick-actions" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => onQuickAction('CALL', customer)} aria-label="Qo'ng'iroqni rejalash">📞</button>
            <button type="button" onClick={() => onQuickAction('REMINDER', customer)} aria-label="Eslatma qo'shish">⏰</button>
            <button type="button" onClick={() => onQuickAction('TASK', customer)} aria-label="Vazifa yaratish">✓</button>
            <button type="button" onClick={() => onQuickAction('NOTE', customer)} aria-label="Izoh qo'shish">✎</button>
          </span>}
        </>
      )}
    </div>
  )
}
