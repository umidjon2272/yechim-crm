import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/Badge/Badge'
import { formatDate } from '../../../utils/formatDate'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE_VARIANTS } from '../../payments/payments.constants'
import './DealCard.scss'

export function DealCard({ deal }) {
  const navigate = useNavigate()

  return (
    <div className="deal-card" onClick={() => navigate(`/admin/crm/deals/${deal.id}`)}>
      <div className="deal-card__name">{deal.name}</div>
      <div className="deal-card__customer">{deal.customer?.name || '—'}</div>
      {deal.business?.name && <div className="deal-card__business">{deal.business.name}</div>}
      <div className="deal-card__footer">
        <span className="deal-card__value">{deal.value != null ? deal.value : '—'}</span>
        {deal.paymentStatus && (
          <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[deal.paymentStatus] || 'gray'}>{PAYMENT_STATUS_LABELS[deal.paymentStatus] || deal.paymentStatus}</Badge>
        )}
      </div>
      <div className="deal-card__meta">
        <span>{deal.salesEmployee?.name || '—'}</span>
        <span>{formatDate(deal.expectedCloseDate)}</span>
      </div>
    </div>
  )
}
