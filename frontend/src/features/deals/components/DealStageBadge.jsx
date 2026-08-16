import { Badge } from '../../../components/Badge/Badge'
import { DEAL_STAGE_LABELS, DEAL_STAGE_BADGE_VARIANTS } from '../deals.constants'

export function DealStageBadge({ stage }) {
  return <Badge variant={DEAL_STAGE_BADGE_VARIANTS[stage] || 'gray'}>{DEAL_STAGE_LABELS[stage] || stage}</Badge>
}
