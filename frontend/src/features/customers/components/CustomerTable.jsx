import { Table } from '../../../components/Table/Table'
import { Badge } from '../../../components/Badge/Badge'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { PermissionGate } from '../../roles/PermissionGate'
import { formatDate } from '../../../utils/formatDate'
import { MoreIcon } from '../../../components/icons/Icons'
import { CUSTOMER_STAGE_LABELS, CUSTOMER_STAGE_BADGE_VARIANTS } from '../customers.constants'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE_VARIANTS } from '../../payments/payments.constants'
import { INSTALLATION_STATUS_LABELS, INSTALLATION_STATUS_BADGE_VARIANTS } from '../../installations/installations.constants'

// onOpen (not a route navigate) — clicking a row opens the customer
// workspace as an overlay over this same list, Bitrix-style. "Tahrirlash"
// lives inside the workspace itself once it's open, not as a separate entry
// point here.
export function CustomerTable({ customers, stageLabels = CUSTOMER_STAGE_LABELS, selectedIds = [], onSelect, onSelectAll, onDeactivate, onOpen }) {
  const selectedSet = new Set(selectedIds)
  const allVisibleSelected = customers.length > 0 && customers.every((customer) => selectedSet.has(customer.id))
  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={(event) => onSelectAll?.(event.target.checked)}
          aria-label="Barcha mijozlarni tanlash"
        />
      ),
      width: 42,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={(event) => onSelect?.(row.id, event.target.checked)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`${row.name} tanlash`}
        />
      ),
    },
    { key: 'name', header: 'Mijoz', render: (row) => <span className="table__cell-primary">{row.name}</span> },
    { key: 'phone', header: 'Telefon', render: (row) => row.phone || '—' },
    { key: 'business', header: 'Biznes', render: (row) => row.business?.name || '—' },
    {
      key: 'programs',
      header: 'Dastur',
      render: (row) =>
        (row.programs || []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {row.programs.map((p) => (
              <Badge key={p.id} variant="gray">
                {p.name}
              </Badge>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'stage',
      header: 'Status',
      render: (row) => <Badge variant={CUSTOMER_STAGE_BADGE_VARIANTS[row.stage] || 'gray'}>{stageLabels[row.stage] || row.stage}</Badge>,
    },
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
    { key: 'assignedEmployee', header: 'Mas’ul', render: (row) => row.assignedEmployee?.name || '—' },
    { key: 'lastContactAt', header: 'Oxirgi aloqa', render: (row) => (row.lastContactAt ? formatDate(row.lastContactAt) : '—') },
    {
      key: 'actions',
      header: '',
      width: 56,
      render: (row) => (
        <div className="table__actions" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={(toggle) => (
              <button type="button" className="header__icon-btn" onClick={toggle} aria-label="Amallar">
                <MoreIcon width={16} height={16} />
              </button>
            )}
          >
            <DropdownItem onClick={() => onOpen(row.id)}>Ko‘rish</DropdownItem>
            <PermissionGate permission="customers.delete">
              <DropdownItem danger onClick={() => onDeactivate(row)}>
                {row.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}
              </DropdownItem>
            </PermissionGate>
          </Dropdown>
        </div>
      ),
    },
  ]

  return <Table columns={columns} data={customers} onRowClick={(row) => onOpen(row.id)} />
}
