import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges'
import { Select } from '../../../components/Select/Select'
import { formatDate } from '../../../utils/formatDate'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '../tasks.constants'

function relatedLabel(row) {
  if (row.program?.name) return `Dastur: ${row.program.name}`
  if (row.deal?.name) return `Savdo: ${row.deal.name}`
  if (row.lead?.title) return `Murojaat: ${row.lead.title}`
  if (row.business?.name) return `Biznes: ${row.business.name}`
  if (row.customer?.name) return `Mijoz: ${row.customer.name}`
  return '—'
}

export function TaskTable({ tasks, onStatusChange, canEditStatus, getStatusOptions, statusLoadingId }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'title', header: 'Sarlavha', render: (row) => <span className="table__cell-primary">{row.title}</span> },
    { key: 'assignedEmployee', header: 'Mas’ul xodim', render: (row) => row.assignedEmployee?.name || '—' },
    { key: 'related', header: 'Bog‘liq', render: relatedLabel },
    { key: 'dueDate', header: 'Muddat', render: (row) => formatDate(row.dueDate) },
    { key: 'priority', header: 'Muhimlik', render: (row) => <TaskPriorityBadge priority={row.priority} /> },
    {
      key: 'status',
      header: 'Holat',
      render: (row) =>
        onStatusChange && canEditStatus?.(row) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.status}
              onChange={(event) => onStatusChange(row, event.target.value)}
              disabled={statusLoadingId === row.id}
              style={{ minWidth: 150 }}
            >
              {(getStatusOptions?.(row) ?? TASK_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <TaskStatusBadge status={row.status} />
        ),
    },
  ]

  // Vazifani bosganda bog'langan mijozga o'tish (mijoz ish oynasi ochiladi).
  return <Table columns={columns} data={tasks} onRowClick={(row) => row.customer?.id && navigate(`/admin/crm/customers/${row.customer.id}`)} />
}
