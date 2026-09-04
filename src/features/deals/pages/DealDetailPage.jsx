import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDeal } from '../deals.hooks'
import { dealsService } from '../../../services/deals.service'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { paymentsService } from '../../../services/payments.service'
import { installationsService } from '../../../services/installations.service'
import { DealForm } from '../components/DealForm'
import { DealStageBadge } from '../components/DealStageBadge'
import { DealItemsEditor } from '../components/DealItemsEditor'
import { PaymentForm } from '../../payments/components/PaymentForm'
import { InstallationForm } from '../../installations/components/InstallationForm'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Modal } from '../../../components/Modal/Modal'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { Tabs } from '../../../components/Tabs/Tabs'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { CommentsSection } from '../../comments/CommentsSection'
import { AttachmentsSection } from '../../attachments/AttachmentsSection'
import { HistorySection } from '../../timeline/HistorySection'
import { ScheduleFollowUpButton } from '../../tasks/components/ScheduleFollowUpButton'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { formatDate } from '../../../utils/formatDate'
import { QUOTATION_STATUS_LABELS } from '../../quotations/quotations.constants'
import { INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'

const TABS = [
  { id: 'overview', label: 'Umumiy' },
  { id: 'items', label: 'Mahsulotlar' },
  { id: 'quotation', label: 'Taklif' },
  { id: 'payments', label: 'To‘lovlar' },
  { id: 'activities', label: 'Faoliyatlar' },
  { id: 'tasks', label: 'Vazifalar' },
  { id: 'installation', label: 'O‘rnatish' },
]

function PaymentsSummary({ dealId, dealValue }) {
  const { data, loading } = useAsync(() => dealsService.getPayments(dealId), [dealId])
  const payments = data?.items ?? data ?? []
  const paid = payments
    .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const total = dealValue != null ? Number(dealValue) : null
  const remaining = total != null ? Math.max(0, total - paid) : null

  return (
    <Card title="To‘lovlar">
      {loading ? (
        <div className="page-loading">
          <Spinner />
        </div>
      ) : (
        <div className="deal-totals">
          <div className="deal-totals__row">
            <span>Jami qiymat</span>
            <span>{total != null ? total : '—'}</span>
          </div>
          <div className="deal-totals__row">
            <span>To‘langan</span>
            <span>{paid}</span>
          </div>
          <div className="deal-totals__row deal-totals__row--grand">
            <span>Qolgan</span>
            <span>{remaining != null ? remaining : '—'}</span>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>
            Qolgan summa faqat ko‘rsatish uchun frontendda hisoblanadi — real moliyaviy holat backendda saqlanadi.
          </p>
        </div>
      )}
    </Card>
  )
}

export function DealDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const [activeTab, setActiveTab] = useState('overview')
  const toast = useToast()

  const confirm = useConfirm()
  const { data: deal, loading, error, refetch } = useDeal(id)
  const updateAction = useAction((values) => dealsService.update(id, values))
  const stageAction = useAction((stage) => dealsService.updateStage(id, stage))
  const createPaymentAction = useAction(paymentsService.create)
  const createInstallationAction = useAction(installationsService.create)
  const [customers, setCustomers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [employees, setEmployees] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const paymentModal = useDisclosure()
  const installationModal = useDisclosure()

  useEffect(() => {
    // Employees are needed both for editing the deal and for the inline
    // Record Payment / Create Installation modals, so this fetch isn't
    // gated behind isEditing like customers/businesses are.
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    customersService.list({ pageSize: 100 }).then((res) => setCustomers(res?.items ?? [])).catch(() => setCustomers([]))
    businessesService.list({ pageSize: 100 }).then((res) => setBusinesses(res?.items ?? [])).catch(() => setBusinesses([]))
  }, [isEditing])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('Savdo yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleStageChange = async (stage, title, description) => {
    const ok = await confirm({ title, description, danger: stage === 'LOST' })
    if (!ok) return
    try {
      await stageAction.run(stage)
      toast.success('Bosqich yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Bosqichni yangilashda xatolik yuz berdi')
    }
  }

  const handleRecordPayment = async (values) => {
    try {
      await createPaymentAction.run(values)
      toast.success('To‘lov qayd etildi')
      paymentModal.close()
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message || 'To‘lov qayd etishda xatolik yuz berdi')
    }
  }

  const handleCreateInstallation = async (values) => {
    try {
      await createInstallationAction.run(values)
      toast.success('O‘rnatish rejalashtirildi')
      installationModal.close()
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message || 'O‘rnatish rejalashtirishda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !deal) {
    return (
      <Alert variant="danger" title="Savdo topilmadi">
        {error?.message || 'Bu savdo mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{deal.name}</h2>
          <p className="page-header__subtitle">
            <DealStageBadge stage={deal.stage} />
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/deals')}>
            Ortga
          </Button>
          <ScheduleFollowUpButton entityName={deal.name} context={{ dealId: id, customerId: deal.customer?.id }} />
          <PermissionGate permission="deals.edit">
            {['NEW', 'QUALIFICATION'].includes(deal.stage) && (
              <Button
                variant="secondary"
                loading={stageAction.loading}
                onClick={() => handleStageChange('DEMO', 'Demo rejalashtirish', `"${deal.name}" uchun demo rejalashtirilsinmi?`)}
              >
                Demo rejalashtirish
              </Button>
            )}
            {!['WON', 'LOST'].includes(deal.stage) && (
              <>
                <Button
                  loading={stageAction.loading}
                  onClick={() => handleStageChange('WON', 'Yutildi deb belgilash', `"${deal.name}" savdosi yutildi deb belgilansinmi?`)}
                >
                  Yutildi deb belgilash
                </Button>
                <Button
                  variant="danger-ghost"
                  loading={stageAction.loading}
                  onClick={() => handleStageChange('LOST', 'Yo‘qotildi deb belgilash', `"${deal.name}" savdosi yo‘qotildi deb belgilansinmi?`)}
                >
                  Yo‘qotildi deb belgilash
                </Button>
              </>
            )}
          </PermissionGate>
          {deal.stage === 'WON' && (
            <>
              <PermissionGate permission="payments.create">
                <Button variant="secondary" onClick={paymentModal.open}>
                  To‘lov qo‘shish
                </Button>
              </PermissionGate>
              <PermissionGate permission="installations.create">
                <Button variant="secondary" onClick={installationModal.open}>
                  O‘rnatish yaratish
                </Button>
              </PermissionGate>
            </>
          )}
          <PermissionGate permission="deals.edit">
            <Button onClick={() => setSearchParams({ edit: '1' })}>Tahrirlash</Button>
          </PermissionGate>
        </div>
      </div>

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <DealForm
            initialValues={deal}
            customers={customers}
            businesses={businesses}
            employees={employees}
            submitLabel="Saqlash"
            loading={updateAction.loading}
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <>
          <Tabs items={TABS} activeId={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <Card title="Umumiy ma'lumot">
              <div className="detail-grid">
                <div className="detail-field">
                  <div className="detail-field__label">Mijoz</div>
                  <div className="detail-field__value">{deal.customer?.name || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Biznes</div>
                  <div className="detail-field__value">{deal.business?.name || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Sotuv xodimi</div>
                  <div className="detail-field__value">{deal.salesEmployee?.name || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Qiymati</div>
                  <div className="detail-field__value">{deal.value != null ? deal.value : '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Holat</div>
                  <div className="detail-field__value">
                    <DealStageBadge stage={deal.stage} />
                  </div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Kutilayotgan yopilish</div>
                  <div className="detail-field__value">{formatDate(deal.expectedCloseDate)}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field__label">Yaratilgan sana</div>
                  <div className="detail-field__value">{formatDate(deal.createdAt)}</div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'items' && <DealItemsEditor dealId={id} />}

          {activeTab === 'quotation' && (
            <RelatedList
              title="Taklif"
              fetcher={() => dealsService.getQuotations(id)}
              deps={[id, refreshKey]}
              linkTo={(item) => `/admin/crm/quotations/${item.id}`}
              renderItem={(item) => <span>#{item.number} — {QUOTATION_STATUS_LABELS[item.status] || item.status}</span>}
              emptyHint="Bu savdo uchun hali taklif yaratilmagan."
              action={
                <PermissionGate permission="quotations.create">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/crm/quotations?dealId=${id}`)}>
                    + Yaratish
                  </Button>
                </PermissionGate>
              }
            />
          )}

          {activeTab === 'payments' && <PaymentsSummary key={refreshKey} dealId={id} dealValue={deal.value} />}

          {activeTab === 'activities' && <ActivitiesSection fetcher={() => dealsService.getActivities(id)} deps={[id]} context={{ dealId: id }} />}

          {activeTab === 'tasks' && (
            <RelatedList
              title="Vazifalar"
              fetcher={() => dealsService.getTasks(id)}
              deps={[id]}
              renderItem={(item) => <span>{item.title}</span>}
              emptyHint="Bu savdo bilan bog‘liq vazifa yo‘q."
            />
          )}

          {activeTab === 'installation' && (
            <RelatedList
              title="O‘rnatish"
              fetcher={() => dealsService.getInstallations(id)}
              deps={[id, refreshKey]}
              linkTo={(item) => `/admin/crm/installations/${item.id}`}
              renderItem={(item) => <span>{INSTALLATION_STATUS_LABELS[item.status] || item.status}</span>}
              emptyHint="Bu savdo uchun hali o‘rnatish rejalashtirilmagan."
              action={
                <PermissionGate permission="installations.create">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/crm/installations?dealId=${id}`)}>
                    + Rejalashtirish
                  </Button>
                </PermissionGate>
              }
            />
          )}
        </>
      )}

      <HistorySection entityType="deal" entityId={id} title="Savdo tarixi" key={`history-${refreshKey}`} />

      <div className="detail-grid">
        <CommentsSection entityType="deal" entityId={id} />
        <AttachmentsSection entityType="deal" entityId={id} />
      </div>

      <Modal open={paymentModal.isOpen} title="To‘lov qo‘shish" onClose={paymentModal.close}>
        <PaymentForm
          deals={[deal]}
          lockDeal
          initialValues={{ dealId: id }}
          submitLabel="Saqlash"
          loading={createPaymentAction.loading}
          onSubmit={handleRecordPayment}
          onCancel={paymentModal.close}
        />
      </Modal>

      <Modal open={installationModal.isOpen} title="O‘rnatish rejalashtirish" onClose={installationModal.close}>
        <InstallationForm
          deals={[deal]}
          employees={employees}
          lockDeal
          initialValues={{ dealId: id }}
          submitLabel="Rejalashtirish"
          loading={createInstallationAction.loading}
          onSubmit={handleCreateInstallation}
          onCancel={installationModal.close}
        />
      </Modal>
    </div>
  )
}
