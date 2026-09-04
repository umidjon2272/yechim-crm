import { Link } from 'react-router-dom'
import { useEmployees } from '../../employees/employees.hooks'
import { Card } from '../../../components/Card/Card'
import { Badge } from '../../../components/Badge/Badge'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { UsersIcon } from '../../../components/icons/Icons'
import { ROLE_LABELS } from '../../roles/permissions'

export function EmployeesSection() {
  const { employees, loading, error } = useEmployees()

  return (
    <Card title="Xodimlar" actions={<Link to="/admin/employees">Barchasini ko‘rish →</Link>}>
      {error && (
        <Alert variant="danger" title="Xodimlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}
      {loading && !error && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}
      {!loading && !error && employees.length === 0 && (
        <EmptyState compact icon={<UsersIcon width={20} height={20} />} title="Xodimlar mavjud emas" />
      )}
      {!loading && !error && employees.length > 0 && (
        <ul className="stack">
          {employees.slice(0, 5).map((employee) => (
            <li key={employee.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {employee.name}
                <span className="text-muted text-xs" style={{ marginLeft: 8 }}>
                  {ROLE_LABELS[employee.role] || employee.role}
                </span>
              </span>
              <Badge variant={employee.status === 'active' ? 'success' : 'gray'}>{employee.status === 'active' ? 'Faol' : 'Nofaol'}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
