import { Badge } from '../../../components/Badge/Badge'
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_BADGE_VARIANTS } from '../quotations.constants'

export function QuotationStatusBadge({ status }) {
  return <Badge variant={QUOTATION_STATUS_BADGE_VARIANTS[status] || 'gray'}>{QUOTATION_STATUS_LABELS[status] || status}</Badge>
}
