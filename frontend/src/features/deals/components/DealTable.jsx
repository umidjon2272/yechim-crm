import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { Badge } from '../../../components/Badge/Badge'
import { DealStageBadge } from './DealStageBadge'
import { formatDate } from '../../../utils/formatDate'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE_VARIANTS } from '../../payments/payments.constants'
import { INSTALLATION_STATUS_LABELS, INSTALLATION_STATUS_BADGE_VARIANTS } from '../../installations/installations.constants'

export function DealTable({ deals }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'name', header: 'Savdo', render: (row) => <span className="table__cell-primary">{row.name}</span> },
    { key: 'customer', header: 'Mijoz', render: (row) => row.customer?.name || '—' },
    { key: 'business', header: 'Biznes', render: (row) => row.business?.name || '—' },
    { key: 'salesEmployee', header: 'Xodim', render: (row) => row.salesEmployee?.name || '—' },
    { key: 'stage', header: 'Bosqich', render: (row) => <DealStageBadge stage={row.stage} /> },
    { key: 'value', header: 'Qiymat', render: (row) => (row.value != null ? row.value : '—') },
    {
      key: 'paymentStatus',
      header: 'To‘lov',
      render: (row) =>
        row.paymentStatus ? (
          <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[row.paymentStatus] || 'gray'}>{PAYMENT_STATUS_LABELS[row.paymentStatus] || row.paymentStatus}</Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'installationStatus',
      header: 'O‘rnatish',
      render: (row) =>
        row.installationStatus ? (
          <Badge variant={INSTALLATION_STATUS_BADGE_VARIANTS[row.installationStatus] || 'gray'}>
            {INSTALLATION_STATUS_LABELS[row.installationStatus] || row.installationStatus}
          </Badge>
        ) : (
          '—'
        ),
    },
    { key: 'expectedCloseDate', header: 'Kutilayotgan yopilish', render: (row) => formatDate(row.expectedCloseDate) },
  ]

  return <Table columns={columns} data={deals} onRowClick={(row) => navigate(`/admin/crm/deals/${row.id}`)} />
}
