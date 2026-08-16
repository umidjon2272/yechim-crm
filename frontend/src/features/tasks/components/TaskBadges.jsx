import { Badge } from '../../../components/Badge/Badge'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_BADGE_VARIANTS, TASK_STATUS_LABELS, TASK_STATUS_BADGE_VARIANTS } from '../tasks.constants'

export function TaskPriorityBadge({ priority }) {
  return <Badge variant={TASK_PRIORITY_BADGE_VARIANTS[priority] || 'gray'}>{TASK_PRIORITY_LABELS[priority] || priority}</Badge>
}

export function TaskStatusBadge({ status }) {
  return <Badge variant={TASK_STATUS_BADGE_VARIANTS[status] || 'gray'}>{TASK_STATUS_LABELS[status] || status}</Badge>
}
