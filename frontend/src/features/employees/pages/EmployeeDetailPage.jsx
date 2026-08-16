import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEmployee } from '../employees.hooks'
import { employeesService } from '../../../services/employees.service'
import { analyticsService } from '../../../services/analytics.service'
import { EmployeeForm } from '../components/EmployeeForm'
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Modal } from '../../../components/Modal/Modal'
import { FormField } from '../../../components/FormField/FormField'
import { PasswordInput } from '../../../components/PasswordInput/PasswordInput'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { StatCard } from '../../../components/charts/StatCard'
import { PermissionGate } from '../../roles/PermissionGate'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { validate, rules } from '../../../utils/validators'
import { formatDate } from '../../../utils/formatDate'
import { ROLE_LABELS, ROLE_DEFAULT_PERMISSIONS } from '../../roles/permissions'
import { INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import { InboxIcon, BuildingIcon, DashboardIcon, TeamIcon, UsersIcon } from '../../../components/icons/Icons'
import './EmployeeDetailPage.scss'

function PerformanceSection({ employeeId }) {
  const { data, loading, error } = useAsync(() => analyticsService.getEmployeePerformance(employeeId), [employeeId])

  if (error) {
    return (
      <Card title="Samaradorlik">
        <p className="text-muted text-xs">Statistikani yuklab bo‘lmadi: {error.message}</p>
      </Card>
    )
  }

  const s = data || {}
  const formatMoney = (value) => `${Number(value || 0).toLocaleString('ru-RU')} so‘m`

  return (
    <Card title="Samaradorlik">
      <div className="stat-card-grid">
        <StatCard label="Biriktirilgan mijozlar" value={s.customers} icon={<InboxIcon width={18} height={18} />} loading={loading} />
        <StatCard label="Sotuvlar" value={s.deals} icon={<BuildingIcon width={18} height={18} />} variant="info" loading={loading} />
        <StatCard label="Sotuv summasi" value={formatMoney(s.revenue)} icon={<DashboardIcon width={18} height={18} />} variant="success" loading={loading} />
        <StatCard label="Bajarilgan vazifalar" value={s.tasksCompleted} icon={<UsersIcon width={18} height={18} />} loading={loading} />
        <StatCard label="Jarayondagi vazifalar" value={s.tasksInProgress} icon={<UsersIcon width={18} height={18} />} variant="info" loading={loading} />
        <StatCard label="Yakunlangan o‘rnatishlar" value={s.installationsCompleted} icon={<TeamIcon width={18} height={18} />} loading={loading} />
      </div>
      <div className="employee-stage-stats">
        {(s.stageStats ?? []).map((stage) => (
          <div key={stage.id} className="employee-stage-stats__item">
            <span>{stage.label}</span>
            <strong>{stage.count}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ManagePermissionsModal({ employee, isOpen, onClose, onSaved }) {
  const [permissions, setPermissions] = useState(employee.permissions ?? [])
  const updateAction = useAction((payload) => employeesService.update(employee.id, payload))
  const toast = useToast()

  const handleSave = async () => {
    try {
      await updateAction.run({ permissions })
      toast.success('Ruxsatlar yangilandi')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Ruxsatlarni saqlashda xatolik yuz berdi')
    }
  }

  return (
    <Modal open={isOpen} title={`${employee.name} — ruxsatlarni boshqarish`} onClose={onClose}>
      <div className="permissions-modal__actions">
        <Button type="button" variant="ghost" size="sm" onClick={() => setPermissions(ROLE_DEFAULT_PERMISSIONS[employee.role] ?? [])}>
          Rol standart ruxsatlariga qaytarish
        </Button>
      </div>
      <PermissionMatrix value={permissions} onChange={setPermissions} />
      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={updateAction.loading}>
          Bekor qilish
        </Button>
        <Button type="button" loading={updateAction.loading} onClick={handleSave}>
          Saqlash
        </Button>
      </div>
    </Modal>
  )
}

function UpdatePasswordModal({ employeeId, isOpen, onClose, onSaved }) {
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const updateAction = useAction((payload) => employeesService.update(employeeId, payload))
  const toast = useToast()

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { password: [rules.required('Yangi parol kiritilishi shart')] })
    if (!nextErrors.password && values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Parollar mos kelmadi'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await updateAction.run({ password: values.password })
      toast.success('Parol yangilandi')
      setValues({ password: '', confirmPassword: '' })
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Parolni yangilashda xatolik yuz berdi')
    }
  }

  return (
    <Modal open={isOpen} title="Parolni yangilash" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Yangi parol" required error={errors.password}>
          <PasswordInput value={values.password} onChange={handleChange('password')} error={!!errors.password} disabled={updateAction.loading} />
        </FormField>
        <FormField label="Parolni tasdiqlash" error={errors.confirmPassword}>
          <PasswordInput
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={!!errors.confirmPassword}
            disabled={updateAction.loading}
          />
        </FormField>
        <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={updateAction.loading}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={updateAction.loading}>
            Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const toast = useToast()
  const confirm = useConfirm()
  const permissionsModal = useDisclosure()
  const passwordModal = useDisclosure()

  const { data: employee, loading, error, refetch } = useEmployee(id)
  const updateAction = useAction((values) => employeesService.update(id, values))
  const toggleStatusAction = useAction((payload) =>
    payload.status === 'active' ? employeesService.activate(id) : employeesService.deactivate(id)
  )
  const [teams] = useState([])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('Ma’lumotlar yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async () => {
    const activating = employee.status !== 'active'
    const ok = await confirm({
      title: activating ? 'Xodimni faollashtirish' : 'Xodimni faolsizlantirish',
      description: `${employee.name} ${activating ? 'faollashtirilsinmi' : 'faolsizlantirilsinmi'}?`,
      confirmLabel: activating ? 'Faollashtirish' : 'Faolsizlantirish',
      danger: !activating,
    })
    if (!ok) return
    try {
      await toggleStatusAction.run({ status: activating ? 'active' : 'inactive' })
      toast.success('Holat yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Holatni yangilashda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <Alert variant="danger" title="Xodim topilmadi">
        {error?.message || 'Bu xodim mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="employee-profile-header">
        <Avatar name={employee.name} src={employee.avatarUrl} size="xl" />
        <div className="employee-profile-header__meta">
          <div className="employee-profile-header__name">{employee.name}</div>
          <div className="employee-profile-header__sub">
            <span>{ROLE_LABELS[employee.role] || employee.role}</span>
            <EmployeeStatusBadge status={employee.status} />
          </div>
        </div>
        <div className="employee-profile-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/employees')}>
            Ortga
          </Button>
          <PermissionGate permission="employees.edit">
            <Button variant="secondary" onClick={passwordModal.open}>
              Parolni yangilash
            </Button>
            <Button variant="secondary" onClick={permissionsModal.open}>
              Ruxsatlarni boshqarish
            </Button>
            <Button
              variant={employee.status === 'active' ? 'danger-ghost' : 'secondary'}
              loading={toggleStatusAction.loading}
              onClick={handleToggleStatus}
            >
              {employee.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}
            </Button>
            <Button onClick={() => setSearchParams({ edit: '1' })}>Tahrirlash</Button>
          </PermissionGate>
        </div>
      </div>

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <EmployeeForm
            initialValues={employee}
            teams={teams}
            submitLabel="Saqlash"
            loading={updateAction.loading}
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <Card title="Shaxsiy ma'lumotlar">
          <div className="detail-grid">
            <div className="detail-field">
              <div className="detail-field__label">Elektron pochta</div>
              <div className="detail-field__value">{employee.email}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Telefon</div>
              <div className="detail-field__value">{employee.phone || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Login</div>
              <div className="detail-field__value">{employee.username || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Jamoa</div>
              <div className="detail-field__value">{employee.team?.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Qo‘shilgan sana</div>
              <div className="detail-field__value">{formatDate(employee.createdAt)}</div>
            </div>
          </div>
        </Card>
      )}

      <Card title="Ruxsatlar">
        <PermissionMatrix value={employee.permissions ?? []} />
      </Card>

      <PerformanceSection employeeId={id} />

      <div className="detail-grid">
        <RelatedList
          title="Biriktirilgan murojaatlar"
          fetcher={() => employeesService.getAssignedLeads(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/leads/${item.id}`}
          renderItem={(item) => <span>{item.title}</span>}
          emptyHint="Bu xodimga hali murojaat biriktirilmagan."
        />
        <RelatedList
          title="Biriktirilgan savdolar"
          fetcher={() => employeesService.getAssignedDeals(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/deals/${item.id}`}
          renderItem={(item) => <span>{item.name}</span>}
          emptyHint="Bu xodimga hali savdo biriktirilmagan."
        />
        <RelatedList
          title="Biriktirilgan o‘rnatishlar"
          fetcher={() => employeesService.getAssignedInstallations(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/installations/${item.id}`}
          renderItem={(item) => <span>{INSTALLATION_STATUS_LABELS[item.status] || item.status}</span>}
          emptyHint="Bu xodimga hali o‘rnatish biriktirilmagan."
        />
        <RelatedList
          title="Biriktirilgan vazifalar"
          fetcher={() => employeesService.getAssignedTasks(id)}
          deps={[id]}
          renderItem={(item) => <span>{item.title}</span>}
          emptyHint="Bu xodimga hali vazifa biriktirilmagan."
        />
      </div>

      <ManagePermissionsModal
        employee={employee}
        isOpen={permissionsModal.isOpen}
        onClose={permissionsModal.close}
        onSaved={() => {
          permissionsModal.close()
          refetch()
        }}
      />
      <UpdatePasswordModal
        employeeId={id}
        isOpen={passwordModal.isOpen}
        onClose={passwordModal.close}
        onSaved={() => passwordModal.close()}
      />
    </div>
  )
}
