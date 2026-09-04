import { Badge } from '../../../components/Badge/Badge'

export function EmployeeStatusBadge({ status }) {
  const isActive = status === 'active'
  return <Badge variant={isActive ? 'success' : 'gray'}>{isActive ? 'Faol' : 'Bloklangan'}</Badge>
}
