import { Table } from '../../../components/Table/Table'
import { Badge } from '../../../components/Badge/Badge'
import { formatDate } from '../../../utils/formatDate'
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE_VARIANTS } from '../payments.constants'

export function PaymentTable({ payments }) {
  const columns = [
    { key: 'customer', header: 'Mijoz', render: (row) => row.customer?.name || row.deal?.customer?.name || '—' },
    { key: 'business', header: 'Biznes', render: (row) => row.business?.name || row.deal?.business?.name || '—' },
    { key: 'deal', header: 'Savdo', render: (row) => row.deal?.name || '—' },
    { key: 'amount', header: 'Summa', render: (row) => <span className="table__cell-primary">{row.amount}</span> },
    { key: 'method', header: 'Usul', render: (row) => PAYMENT_METHOD_LABELS[row.method] || row.method },
    {
      key: 'status',
      header: 'Holat',
      render: (row) => <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[row.status] || 'gray'}>{PAYMENT_STATUS_LABELS[row.status] || row.status}</Badge>,
    },
    { key: 'date', header: 'Sana', render: (row) => formatDate(row.date) },
    { key: 'employee', header: 'Xodim', render: (row) => row.employee?.name || '—' },
  ]

  return <Table columns={columns} data={payments} />
}
