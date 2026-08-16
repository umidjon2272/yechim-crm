import './CustomerKanbanCard.scss'
import { formatCustomerAmount, getCustomerAmount } from '../customerAmount'

export { getCustomerAmount }

export function CustomerKanbanCard({ customer, selected = false, onSelect, onOpen }) {
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
    <button type="button" className="customer-kanban-card" onClick={() => onOpen(customer.id)}>
      {onSelect && (
        <span className="customer-kanban-card__select" onClick={(event) => event.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={(event) => onSelect(customer.id, event.target.checked)} aria-label={`${customer.name} tanlash`} />
        </span>
      )}
      <span className="customer-kanban-card__top">
        <span className="customer-kanban-card__avatar">{initials}</span>
        <span className="customer-kanban-card__identity">
          <span className="customer-kanban-card__name">{customer.name}</span>
          <span className="customer-kanban-card__product">{product}</span>
        </span>
      </span>
      <span className="customer-kanban-card__amount">{amount > 0 ? formatCustomerAmount(amount) : '-'}</span>
      <span className="customer-kanban-card__footer">
        <span className="customer-kanban-card__assignee-dot" aria-hidden="true" />
        <span className="customer-kanban-card__assignee">{customer.assignedEmployee?.name || '-'}</span>
      </span>
    </button>
  )
}
