import './CustomerKanbanCard.scss'
import { formatCustomerCurrencyAmount, getCustomerAmount } from '../customerAmount'

export { getCustomerAmount }

function partnerProgressLabel(customer) {
  if (customer.isCompleted) return 'Yakunlangan'
  if (customer.stage === 'NEW') return 'Yangi'
  return 'Jarayonda'
}

export function CustomerKanbanCard({ customer, selected = false, onSelect, onOpen, onQuickAction, partner = false, stageLabel }) {
  const primaryProgram = customer.programs?.[0]?.name
  const product = primaryProgram || customer.business?.name || '-'
  const amount = getCustomerAmount(customer)
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
          <span className="customer-kanban-card__product">{partner ? customer.phone || '-' : product}</span>
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
          <span className="customer-kanban-card__amount">{amount > 0 ? formatCustomerCurrencyAmount(amount, customer.currency) : '-'}</span>
          {(customer.isFollowUpToday || customer.isFollowUpOverdue) && (
            <span className={customer.isFollowUpOverdue ? 'customer-kanban-card__follow-up customer-kanban-card__follow-up--overdue' : 'customer-kanban-card__follow-up'}>
              {customer.isFollowUpOverdue ? '⚠ Aloqa kechikdi' : 'Bugun'}
            </span>
          )}
          {customer.nextContactAt && !customer.isFollowUpOverdue && !customer.isFollowUpToday && <span className="customer-kanban-card__contact">⏰ {new Date(customer.nextContactAt).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          {customer.stageDurationDays > 0 && <span className={customer.isStageStale ? 'customer-kanban-card__stage-duration customer-kanban-card__stage-duration--stale' : 'customer-kanban-card__stage-duration'}>{customer.isStageStale ? `${customer.stageDurationDays} kundan beri harakat yo'q` : `${stageLabel || customer.stageLabel || customer.stage}: ${customer.stageDurationDays} kun`}</span>}
          <span className="customer-kanban-card__footer">
            <span className="customer-kanban-card__assignee-dot" aria-hidden="true" />
            <span className="customer-kanban-card__assignee">{customer.assignedEmployee?.name || '-'}</span>
          </span>
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
