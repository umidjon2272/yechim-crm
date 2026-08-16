import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCustomer } from '../customers.hooks'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { paymentsService } from '../../../services/payments.service'
import { installationsService } from '../../../services/installations.service'
import { CustomerForm } from '../components/CustomerForm'
import { ProgramsPanel } from '../components/ProgramsPanel'
import { CustomerGroupsField } from '../components/CustomerGroupsField'
import { CUSTOMER_STATUS_LABELS } from '../customers.constants'
import { PAYMENT_STATUS_LABELS } from '../../payments/payments.constants'
import { INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { Badge } from '../../../components/Badge/Badge'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { Tabs } from '../../../components/Tabs/Tabs'
import { Modal } from '../../../components/Modal/Modal'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { LogCallButton } from '../../activities/components/LogCallButton'
import { CommentsSection } from '../../comments/CommentsSection'
import { AttachmentsSection } from '../../attachments/AttachmentsSection'
import { HistorySection } from '../../timeline/HistorySection'
import { ScheduleFollowUpButton } from '../../tasks/components/ScheduleFollowUpButton'
import { MessagesPanel } from '../../messages/MessagesPanel'
import { PaymentForm } from '../../payments/components/PaymentForm'
import { InstallationForm } from '../../installations/components/InstallationForm'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { formatDate } from '../../../utils/formatDate'
import { MoreIcon, PlusIcon } from '../../../components/icons/Icons'
import './CustomerDetailPage.scss'

const TABS = [
  { id: 'overview', label: 'Umumiy' },
  { id: 'programs', label: 'Dasturlar' },
  { id: 'business', label: 'Biznes' },
  { id: 'leads', label: 'Murojaatlar' },
  { id: 'deals', label: 'Savdolar' },
  { id: 'payments', label: 'To‘lovlar' },
  { id: 'tasks', label: 'Vazifalar' },
  { id: 'activities', label: 'Faoliyatlar' },
  { id: 'installations', label: 'O‘rnatishlar' },
  { id: 'messages', label: 'Yozishmalar' },
  { id: 'attachments', label: 'Fayllar' },
  { id: 'comments', label: 'Izohlar' },
]

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const toast = useToast()
  const confirm = useConfirm()
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  const { data: customer, loading, error, refetch } = useCustomer(id)
  const updateAction = useAction((values) => customersService.update(id, values))
  const deactivateAction = useAction(() => customersService.deactivate(id))
  const [employees, setEmployees] = useState([])
  const { data: dealsData } = useAsync(() => customersService.getDeals(id), [id, refreshKey])
  const customerDeals = dealsData?.items ?? []

  const paymentModal = useDisclosure()
  const installationModal = useDisclosure()
  const createPaymentAction = useAction(paymentsService.create)
  const createInstallationAction = useAction(installationsService.create)

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleUpdate = async (values, businessPayload) => {
    try {
      await updateAction.run(values)
      if (businessPayload) {
        await businessesService.create({ ...businessPayload, customerId: id })
      }
      toast.success('Mijoz ma’lumotlari yangilandi')
      setSearchParams({})
      refetch()
      bump()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleDeactivate = async () => {
    const activating = customer.status !== 'active'
    const ok = await confirm({
      title: activating ? 'Mijozni faollashtirish' : 'Mijozni faolsizlantirish',
      description: `${customer.name} ${activating ? 'faollashtirilsinmi' : 'faolsizlantirilsinmi'}?`,
      confirmLabel: activating ? 'Faollashtirish' : 'Faolsizlantirish',
      danger: !activating,
    })
    if (!ok) return
    try {
      await deactivateAction.run()
      toast.success('Holat yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Holatni yangilashda xatolik yuz berdi')
    }
  }

  const handleRecordPayment = async (values) => {
    try {
      await createPaymentAction.run(values)
      toast.success('To‘lov qayd etildi')
      paymentModal.close()
      bump()
    } catch (err) {
      toast.error(err.message || 'To‘lovni saqlashda xatolik yuz berdi')
    }
  }

  const handleCreateInstallation = async (values) => {
    try {
      await createInstallationAction.run(values)
      toast.success('O‘rnatish rejalashtirildi')
      installationModal.close()
      bump()
    } catch (err) {
      toast.error(err.message || 'O‘rnatishni saqlashda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <Alert variant="danger" title="Mijoz topilmadi">
        {error?.message || 'Bu mijoz mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="page-header customer-detail-header">
        <div className="customer-detail-header__identity">
          <Avatar name={customer.name} size="xl" />
          <div>
            <h2 className="page-header__title">{customer.name}</h2>
            <p className="page-header__subtitle">
              {customer.phone && <span>{customer.phone} · </span>}
              {customer.business?.name && <span>{customer.business.name} · </span>}
              <Badge variant={customer.status === 'active' ? 'success' : 'gray'}>
                {CUSTOMER_STATUS_LABELS[customer.status] || customer.status}
              </Badge>
            </p>
          </div>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/customers')}>
            Ortga
          </Button>
          <PermissionGate permission="customers.edit">
            <Button variant="secondary" onClick={() => setActiveTab('programs')}>
              + Dastur
            </Button>
          </PermissionGate>
          <ScheduleFollowUpButton entityName={customer.name} context={{ customerId: id }} label="+ Vazifa" onCreated={bump} />
          <LogCallButton context={{ customerId: id }} onCreated={bump} />
          <Button variant="secondary" onClick={() => setActiveTab('messages')}>
            Xabar
          </Button>
          <PermissionGate permission="customers.edit">
            <Button onClick={() => setSearchParams({ edit: '1' })}>Tahrirlash</Button>
          </PermissionGate>
          <Dropdown
            trigger={(toggle) => (
              <button type="button" className="header__icon-btn" onClick={toggle} aria-label="Boshqa amallar">
                <MoreIcon width={18} height={18} />
              </button>
            )}
          >
            <PermissionGate permission="customers.delete">
              <DropdownItem onClick={handleDeactivate}>{customer.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}</DropdownItem>
            </PermissionGate>
          </Dropdown>
        </div>
      </div>

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <CustomerForm
            initialValues={customer}
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
            <div className="stack">
              <Card title="Umumiy ma'lumot">
                <div className="detail-grid">
                  <div className="detail-field">
                    <div className="detail-field__label">Telefon</div>
                    <div className="detail-field__value">{customer.phone || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Qo‘shimcha telefon</div>
                    <div className="detail-field__value">{customer.phone2 || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Telegram</div>
                    <div className="detail-field__value">{customer.telegram || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Elektron pochta</div>
                    <div className="detail-field__value">{customer.email || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Manzil</div>
                    <div className="detail-field__value">
                      {[customer.address?.region, customer.address?.city, customer.address?.district, customer.address?.street, customer.address?.house]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Mas'ul xodim</div>
                    <div className="detail-field__value">{customer.assignedEmployee?.name || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Mijoz manbasi</div>
                    <div className="detail-field__value">{customer.source || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field__label">Qo‘shilgan sana</div>
                    <div className="detail-field__value">{formatDate(customer.createdAt)}</div>
                  </div>
                </div>
                {customer.notes && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="detail-field__label">Izoh</div>
                    <div className="detail-field__value">{customer.notes}</div>
                  </div>
                )}
              </Card>
              <Card title="Guruhlar">
                <CustomerGroupsField customer={customer} onChanged={refetch} />
              </Card>
              <HistorySection entityType="customer" entityId={id} title="Mijozning to‘liq tarixi" key={`history-${refreshKey}`} />
            </div>
          )}

          {activeTab === 'programs' && <ProgramsPanel customerId={id} programs={customer.programs || []} onChanged={refetch} />}

          {activeTab === 'business' && (
            <RelatedList
              title="Bizneslar"
              fetcher={() => customersService.getBusinesses(id)}
              deps={[id, refreshKey]}
              linkTo={(item) => `/admin/crm/businesses/${item.id}`}
              renderItem={(item) => <span>{item.name}</span>}
              emptyHint="Bu mijozga hali biznes biriktirilmagan."
              action={
                <PermissionGate permission="businesses.create">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/crm/businesses?customerId=${id}`)}>
                    + Qo‘shish
                  </Button>
                </PermissionGate>
              }
            />
          )}

          {activeTab === 'leads' && (
            <RelatedList
              title="Murojaatlar"
              fetcher={() => customersService.getLeads(id)}
              deps={[id]}
              linkTo={(item) => `/admin/crm/leads/${item.id}`}
              renderItem={(item) => <span>{item.title}</span>}
              emptyHint="Bu mijoz uchun hali murojaat yaratilmagan."
            />
          )}

          {activeTab === 'deals' && (
            <RelatedList
              title="Savdolar"
              fetcher={() => customersService.getDeals(id)}
              deps={[id, refreshKey]}
              linkTo={(item) => `/admin/crm/deals/${item.id}`}
              renderItem={(item) => <span>{item.name}</span>}
              emptyHint="Bu mijoz uchun hali savdo yaratilmagan."
            />
          )}

          {activeTab === 'payments' && (
            <div className="stack">
              <RelatedList
                title="To‘lovlar"
                fetcher={() => customersService.getPayments(id)}
                deps={[id, refreshKey]}
                renderItem={(item) => <span>{item.amount} — {PAYMENT_STATUS_LABELS[item.status] || item.status}</span>}
                emptyHint="Bu mijoz uchun hali to‘lov qayd etilmagan."
                action={
                  customerDeals.length > 0 && (
                    <PermissionGate permission="payments.create">
                      <Button size="sm" variant="ghost" onClick={paymentModal.open}>
                        <PlusIcon width={14} height={14} /> To‘lov qo‘shish
                      </Button>
                    </PermissionGate>
                  )
                }
              />
              {customerDeals.length === 0 && (
                <p className="text-muted text-xs">To‘lov qo‘shish uchun avval bu mijozga savdo yaratilishi kerak.</p>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <RelatedList
              title="Vazifalar"
              fetcher={() => customersService.getTasks(id)}
              deps={[id, refreshKey]}
              renderItem={(item) => <span>{item.title}</span>}
              emptyHint="Bu mijoz bilan bog‘liq vazifa yo‘q."
            />
          )}

          {activeTab === 'activities' && (
            <div className="stack">
              <ActivitiesSection fetcher={() => customersService.getActivities(id)} deps={[id, refreshKey]} context={{ customerId: id }} />
            </div>
          )}

          {activeTab === 'installations' && (
            <div className="stack">
              <RelatedList
                title="O‘rnatishlar"
                fetcher={() => customersService.getInstallations(id)}
                deps={[id, refreshKey]}
                linkTo={(item) => `/admin/crm/installations/${item.id}`}
                renderItem={(item) => <span>{INSTALLATION_STATUS_LABELS[item.status] || item.status}</span>}
                emptyHint="Bu mijoz uchun hali o‘rnatish rejalashtirilmagan."
                action={
                  customerDeals.length > 0 && (
                    <PermissionGate permission="installations.create">
                      <Button size="sm" variant="ghost" onClick={installationModal.open}>
                        <PlusIcon width={14} height={14} /> O‘rnatish yaratish
                      </Button>
                    </PermissionGate>
                  )
                }
              />
              {customerDeals.length === 0 && (
                <p className="text-muted text-xs">O‘rnatish yaratish uchun avval bu mijozga savdo yaratilishi kerak.</p>
              )}
            </div>
          )}

          {activeTab === 'messages' && <MessagesPanel customerId={id} />}

          {activeTab === 'comments' && <CommentsSection entityType="customer" entityId={id} />}

          {activeTab === 'attachments' && <AttachmentsSection entityType="customer" entityId={id} />}
        </>
      )}

      <Modal open={paymentModal.isOpen} title="To‘lov qo‘shish" onClose={paymentModal.close}>
        <PaymentForm
          deals={customerDeals}
          submitLabel="Saqlash"
          loading={createPaymentAction.loading}
          onSubmit={handleRecordPayment}
          onCancel={paymentModal.close}
        />
      </Modal>

      <Modal open={installationModal.isOpen} title="O‘rnatish rejalashtirish" onClose={installationModal.close}>
        <InstallationForm
          deals={customerDeals}
          employees={employees}
          submitLabel="Rejalashtirish"
          loading={createInstallationAction.loading}
          onSubmit={handleCreateInstallation}
          onCancel={installationModal.close}
        />
      </Modal>
    </div>
  )
}
