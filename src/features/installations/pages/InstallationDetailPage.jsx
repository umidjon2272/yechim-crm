import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useInstallation } from '../installations.hooks'
import { installationsService } from '../../../services/installations.service'
import { dealsService } from '../../../services/deals.service'
import { employeesService } from '../../../services/employees.service'
import { InstallationForm } from '../components/InstallationForm'
import { InstallationStatusBadge } from '../components/InstallationStatusBadge'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { ScheduleFollowUpButton } from '../../tasks/components/ScheduleFollowUpButton'
import { useAction } from '../../../hooks/useAction'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { formatDate } from '../../../utils/formatDate'

export function InstallationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const toast = useToast()

  const confirm = useConfirm()
  const { data: installation, loading, error, refetch } = useInstallation(id)
  const updateAction = useAction((values) => installationsService.update(id, values))
  const statusAction = useAction((values) => installationsService.update(id, values))
  const [deals, setDeals] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    if (!isEditing) return
    dealsService.list({ pageSize: 100 }).then((res) => setDeals(res?.items ?? [])).catch(() => setDeals([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [isEditing])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('O‘rnatish ma’lumotlari yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleStart = async () => {
    const ok = await confirm({ title: 'O‘rnatishni boshlash', description: 'O‘rnatish "Jarayonda" holatiga o‘tkazilsinmi?' })
    if (!ok) return
    try {
      await statusAction.run({ status: 'IN_PROGRESS', startedDate: new Date().toISOString().slice(0, 10) })
      toast.success('O‘rnatish boshlandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi')
    }
  }

  const handleComplete = async () => {
    const ok = await confirm({ title: 'O‘rnatishni tugallash', description: 'O‘rnatish "Yakunlangan" deb belgilansinmi?' })
    if (!ok) return
    try {
      await statusAction.run({ status: 'COMPLETED', completedDate: new Date().toISOString().slice(0, 10) })
      toast.success('O‘rnatish tugallandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !installation) {
    return (
      <Alert variant="danger" title="O‘rnatish topilmadi">
        {error?.message || 'Bu o‘rnatish mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{installation.deal?.name || 'O‘rnatish'}</h2>
          <p className="page-header__subtitle">
            <InstallationStatusBadge status={installation.status} />
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/installations')}>
            Ortga
          </Button>
          <PermissionGate permission="installations.edit">
            {['PENDING', 'SCHEDULED'].includes(installation.status) && (
              <Button variant="secondary" loading={statusAction.loading} onClick={handleStart}>
                O‘rnatishni boshlash
              </Button>
            )}
            {installation.status === 'IN_PROGRESS' && (
              <Button loading={statusAction.loading} onClick={handleComplete}>
                O‘rnatishni yakunlash
              </Button>
            )}
          </PermissionGate>
          {installation.status === 'COMPLETED' && (
            <ScheduleFollowUpButton
              entityName={installation.customer?.name || installation.deal?.customer?.name}
              context={{ installationId: id, dealId: installation.deal?.id, customerId: installation.customer?.id || installation.deal?.customer?.id }}
            />
          )}
          <PermissionGate permission="installations.edit">
            <Button onClick={() => setSearchParams({ edit: '1' })}>Tahrirlash</Button>
          </PermissionGate>
        </div>
      </div>

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <InstallationForm
            initialValues={installation}
            deals={deals}
            employees={employees}
            submitLabel="Saqlash"
            loading={updateAction.loading}
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <Card title="Umumiy ma'lumot">
          <div className="detail-grid">
            <div className="detail-field">
              <div className="detail-field__label">Mijoz</div>
              <div className="detail-field__value">{installation.customer?.name || installation.deal?.customer?.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Biznes</div>
              <div className="detail-field__value">{installation.business?.name || installation.deal?.business?.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Savdo</div>
              <div className="detail-field__value">{installation.deal?.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Mahsulot</div>
              <div className="detail-field__value">{installation.dealItem?.product || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Mas'ul xodim</div>
              <div className="detail-field__value">{installation.assignedEmployee?.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Manzil</div>
              <div className="detail-field__value">{installation.address || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Rejalashtirilgan sana</div>
              <div className="detail-field__value">{formatDate(installation.scheduledDate)}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Boshlangan sana</div>
              <div className="detail-field__value">{formatDate(installation.startedDate)}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field__label">Tugallangan sana</div>
              <div className="detail-field__value">{formatDate(installation.completedDate)}</div>
            </div>
          </div>
          {installation.notes && (
            <div className="detail-field" style={{ marginTop: 16 }}>
              <div className="detail-field__label">Izohlar</div>
              <div className="detail-field__value">{installation.notes}</div>
            </div>
          )}
        </Card>
      )}

      <RelatedList
        title="Vazifalar"
        fetcher={() => installationsService.getTasks(id)}
        deps={[id]}
        renderItem={(item) => <span>{item.title}</span>}
        emptyHint="Bu o‘rnatish bilan bog‘liq vazifa yo‘q."
      />

      <ActivitiesSection fetcher={() => installationsService.getActivities(id)} deps={[id]} context={{ installationId: id }} />
    </div>
  )
}
