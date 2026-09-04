import { Badge } from '../../../components/Badge/Badge'
import { LEAD_STATUS_LABELS, LEAD_STATUS_BADGE_VARIANTS } from '../leads.constants'

export function LeadStatusBadge({ status }) {
  return <Badge variant={LEAD_STATUS_BADGE_VARIANTS[status] || 'gray'}>{LEAD_STATUS_LABELS[status] || status}</Badge>
}
