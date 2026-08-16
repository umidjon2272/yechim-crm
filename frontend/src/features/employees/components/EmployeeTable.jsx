import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/Table/Table'
import { Avatar } from '../../../components/Avatar/Avatar'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { EmployeeStatusBadge } from './EmployeeStatusBadge'
import { PermissionGate } from '../../roles/PermissionGate'
import { formatDate } from '../../../utils/formatDate'
import { MoreIcon } from '../../../components/icons/Icons'
import { ROLE_LABELS } from '../../roles/permissions'

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} so‘m`
}

export function EmployeeTable({ employees, onToggleStatus }) {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'name',
      header: 'Ism',
      render: (row) => (
        <div className="table-user">
          <Avatar name={row.name} src={row.avatarUrl} size="sm" />
          <span className="table__cell-primary">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Telefon / Elektron pochta',
      render: (row) => (
        <div>
          <div>{row.phone || '—'}</div>
          <div className="table__cell-muted">{row.email}</div>
        </div>
      ),
    },
    { key: 'role', header: 'Rol', render: (row) => ROLE_LABELS[row.role] || row.role },
    {
      key: 'performance',
      header: 'Natija',
      render: (row) => (
        <div>
          <div>{row.performance?.customers ?? 0} mijoz</div>
          <div className="table__cell-muted">{formatMoney(row.performance?.revenue)}</div>
          <div className="table__cell-muted">
            {row.performance?.tasksCompleted ?? 0} bajarildi / {row.performance?.tasksInProgress ?? 0} jarayonda
          </div>
        </div>
      ),
    },
    { key: 'team', header: 'Jamoa', render: (row) => row.team?.name || '—' },
    { key: 'status', header: 'Holat', render: (row) => <EmployeeStatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Qo‘shilgan', render: (row) => formatDate(row.createdAt) },
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
            <DropdownItem onClick={() => navigate(`/admin/employees/${row.id}`)}>Ko‘rish</DropdownItem>
            <PermissionGate permission="employees.edit">
              <DropdownItem onClick={() => navigate(`/admin/employees/${row.id}?edit=1`)}>Tahrirlash</DropdownItem>
            </PermissionGate>
            <PermissionGate permission="employees.edit">
              <DropdownItem danger={row.status === 'active'} onClick={() => onToggleStatus(row)}>
                {row.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}
              </DropdownItem>
            </PermissionGate>
          </Dropdown>
        </div>
      ),
    },
  ]

  return <Table columns={columns} data={employees} onRowClick={(row) => navigate(`/admin/employees/${row.id}`)} />
}
