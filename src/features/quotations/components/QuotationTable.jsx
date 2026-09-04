import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { QuotationStatusBadge } from './QuotationStatusBadge'
import { formatDate } from '../../../utils/formatDate'

export function QuotationTable({ quotations }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'number', header: 'Raqam', render: (row) => <span className="table__cell-primary">#{row.number}</span> },
    { key: 'customer', header: 'Mijoz', render: (row) => row.customer?.name || '—' },
    { key: 'business', header: 'Biznes', render: (row) => row.business?.name || '—' },
    { key: 'deal', header: 'Savdo', render: (row) => row.deal?.name || '—' },
    { key: 'total', header: 'Jami', render: (row) => (row.total != null ? row.total : '—') },
    { key: 'status', header: 'Holat', render: (row) => <QuotationStatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Yaratilgan', render: (row) => formatDate(row.createdAt) },
    { key: 'validUntil', header: 'Amal qilish muddati', render: (row) => formatDate(row.validUntil) },
  ]

  return <Table columns={columns} data={quotations} onRowClick={(row) => navigate(`/admin/crm/quotations/${row.id}`)} />
}
