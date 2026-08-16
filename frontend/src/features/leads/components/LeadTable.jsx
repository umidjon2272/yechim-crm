import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { LeadStatusBadge } from './LeadStatusBadge'
import { formatDate } from '../../../utils/formatDate'
import { LEAD_SOURCE_LABELS, INTEREST_LEVEL_LABELS } from '../leads.constants'

export function LeadTable({ leads }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'title', header: 'Murojaat', render: (row) => <span className="table__cell-primary">{row.title}</span> },
    { key: 'customer', header: 'Mijoz', render: (row) => row.customer?.name || '—' },
    { key: 'source', header: 'Manba', render: (row) => LEAD_SOURCE_LABELS[row.source] || row.source },
    { key: 'interestLevel', header: 'Qiziqish', render: (row) => INTEREST_LEVEL_LABELS[row.interestLevel] || row.interestLevel },
    { key: 'assignedEmployee', header: 'Mas’ul xodim', render: (row) => row.assignedEmployee?.name || '—' },
    { key: 'status', header: 'Holat', render: (row) => <LeadStatusBadge status={row.status} /> },
    { key: 'expectedValue', header: 'Kutilayotgan summa', render: (row) => (row.expectedValue != null ? row.expectedValue : '—') },
    { key: 'nextFollowUpDate', header: 'Keyingi aloqa', render: (row) => formatDate(row.nextFollowUpDate) },
  ]

  return <Table columns={columns} data={leads} onRowClick={(row) => navigate(`/admin/crm/leads/${row.id}`)} />
}
