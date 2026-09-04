import { Badge } from '../../../components/Badge/Badge'
import { INSTALLATION_STATUS_LABELS, INSTALLATION_STATUS_BADGE_VARIANTS } from '../installations.constants'

export function InstallationStatusBadge({ status }) {
  return <Badge variant={INSTALLATION_STATUS_BADGE_VARIANTS[status] || 'gray'}>{INSTALLATION_STATUS_LABELS[status] || status}</Badge>
}
