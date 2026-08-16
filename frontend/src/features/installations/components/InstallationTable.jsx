import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { InstallationStatusBadge } from './InstallationStatusBadge'
import { formatDate } from '../../../utils/formatDate'

export function InstallationTable({ installations }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'customer', header: 'Mijoz', render: (row) => row.customer?.name || row.deal?.customer?.name || '—' },
    { key: 'business', header: 'Biznes', render: (row) => row.business?.name || row.deal?.business?.name || '—' },
    { key: 'deal', header: 'Savdo', render: (row) => row.deal?.name || '—' },
    { key: 'product', header: 'Mahsulot', render: (row) => row.dealItem?.product || '—' },
    { key: 'assignedEmployee', header: 'Xodim', render: (row) => row.assignedEmployee?.name || '—' },
    { key: 'address', header: 'Manzil', render: (row) => row.address || '—' },
    { key: 'scheduledDate', header: 'Rejalashtirilgan', render: (row) => formatDate(row.scheduledDate) },
    { key: 'status', header: 'Holat', render: (row) => <InstallationStatusBadge status={row.status} /> },
  ]

  return <Table columns={columns} data={installations} onRowClick={(row) => navigate(`/admin/crm/installations/${row.id}`)} />
}
