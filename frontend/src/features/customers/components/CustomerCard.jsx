import { Avatar } from '../../../components/Avatar/Avatar'
import { Badge } from '../../../components/Badge/Badge'
import { CUSTOMER_STAGE_LABELS, CUSTOMER_STAGE_BADGE_VARIANTS } from '../customers.constants'
import { formatCustomerBusinessTypes } from '../businessTypes'
import { formatDate } from '../../../utils/formatDate'
import './CustomerCard.scss'

// onOpen (not a route navigate) — clicking a card opens the customer
// workspace as an overlay over this same list, Bitrix-style, rather than
// replacing the page.
export function CustomerCard({ customer, onOpen }) {
  const programs = customer.programs || []
  const summary = customer.nextReminder?.remindAt
    ? `${customer.nextReminder.title || 'Eslatma'} · ${new Date(customer.nextReminder.remindAt).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : customer.latestNote?.message
      ? `Oxirgi izoh: ${customer.latestNote.message}`
      : formatCustomerBusinessTypes(customer, 1) || customer.service || programs[0]?.name || (typeof customer.address === 'string' ? customer.address : '')

  return (
    <div className="customer-card" onClick={() => onOpen(customer.id)}>
      <div className="customer-card__top">
        <Avatar name={customer.name} size="lg" />
        <div className="customer-card__identity">
          <span className="customer-card__name">{customer.name}</span>
          {customer.phone && <span className="customer-card__phone">{customer.phone}</span>}
        </div>
      </div>

      {programs.length > 0 && (
        <div className="customer-card__programs">
          {programs.map((program) => (
            <span key={program.id} className="customer-card__program-tag">
              {program.name}
            </span>
          ))}
        </div>
      )}

      {customer.business?.name && <div className="customer-card__business">{customer.business.name}</div>}
      {formatCustomerBusinessTypes(customer, 1) && <div className="customer-card__business"><strong>Biznes turi:</strong> {formatCustomerBusinessTypes(customer, 1)}</div>}
      {summary && <div className="customer-card__summary">{summary}</div>}
      {customer.createdBy?.name && <div className="customer-card__meta-row"><span>Qo‘shgan</span><strong>{customer.createdBy.name}</strong></div>}
      {customer.lastContactVisible !== false && <div className="customer-card__meta-row"><span>Oxirgi aloqa</span><strong>{customer.lastContact ? `${formatDate(customer.lastContact.at)}${customer.lastContact.user?.name ? ` · ${customer.lastContact.user.name}` : ''}` : 'Hali aloqa qilinmagan'}</strong></div>}

      <div className="customer-card__footer">
        <Badge variant={CUSTOMER_STAGE_BADGE_VARIANTS[customer.stage] || 'gray'}>
          {CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage}
        </Badge>
        <span className="customer-card__assignee">Mas'ul: {customer.assignedEmployee?.name || '—'}</span>
      </div>
    </div>
  )
}
