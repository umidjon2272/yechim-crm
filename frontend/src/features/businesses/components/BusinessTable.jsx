import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { Badge } from '../../../components/Badge/Badge'
import { BUSINESS_STATUS_LABELS } from '../businesses.constants'

export function BusinessTable({ businesses }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'name', header: 'Biznes', render: (row) => <span className="table__cell-primary">{row.name}</span> },
    { key: 'businessType', header: 'Turi', render: (row) => row.businessType || '—' },
    { key: 'customer', header: 'Egasi', render: (row) => row.customer?.name || '—' },
    { key: 'city', header: 'Shahar', render: (row) => row.city || '—' },
    {
      key: 'status',
      header: 'Holat',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'gray'}>{BUSINESS_STATUS_LABELS[row.status] || row.status}</Badge>,
    },
    { key: 'assignedEmployee', header: 'Mas’ul xodim', render: (row) => row.assignedEmployee?.name || '—' },
  ]

  return <Table columns={columns} data={businesses} onRowClick={(row) => navigate(`/admin/crm/businesses/${row.id}`)} />
}
