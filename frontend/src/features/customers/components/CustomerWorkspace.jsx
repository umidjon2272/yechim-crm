import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../customers.hooks'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { dealsService } from '../../../services/deals.service'
import { paymentsService } from '../../../services/payments.service'
import { CustomerForm } from './CustomerForm'
import { formatCustomerAmount, getCustomerAmount } from '../customerAmount'
import { ProgramsPanel } from './ProgramsPanel'
import { InstallationsPanel } from './InstallationsPanel'
import { CustomerGroupsField } from './CustomerGroupsField'
import { CustomerSummaryTiles } from './CustomerSummaryTiles'
import { CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS, CUSTOMER_STAGE_BADGE_VARIANTS } from '../customers.constants'
import { PAYMENT_STATUS_LABELS } from '../../payments/payments.constants'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { Badge } from '../../../components/Badge/Badge'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { Tabs } from '../../../components/Tabs/Tabs'
import { Modal } from '../../../components/Modal/Modal'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { CommentsSection } from '../../comments/CommentsSection'
import { AttachmentsSection } from '../../attachments/AttachmentsSection'
import { HistorySection } from '../../timeline/HistorySection'
import { ScheduleFollowUpButton } from '../../tasks/components/ScheduleFollowUpButton'
import { MessagesPanel } from '../../messages/MessagesPanel'
import { PaymentForm } from '../../payments/components/PaymentForm'
import { DealItemsEditor } from '../../deals/components/DealItemsEditor'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { formatDate } from '../../../utils/formatDate'
import { MoreIcon, PlusIcon, PhoneIcon, InboxIcon } from '../../../components/icons/Icons'
import './CustomerWorkspace.scss'

const BASE_SIDE_TABS = [
  { id: 'overview', label: 'Umumiy' },
  { id: 'programs', label: 'Dasturlar' },
  { id: 'order', label: 'Buyurtma' },
  { id: 'leads', label: 'Murojaatlar' },
  { id: 'deals', label: 'Savdolar' },
  { id: 'payments', label: 'To‘lovlar' },
  { id: 'tasks', label: 'Vazifalar' },
  { id: 'activities', label: 'Faoliyatlar' },
  { id: 'installations', label: 'O‘rnatishlar' },
  { id: 'attachments', label: 'Fayllar' },
  { id: 'comments', label: 'Izohlar' },
]

// The Bitrix-style "customer element" panel: chat is the main, always-
// visible column (no click required to reach it) — everything else
// (programs, deals, payments, tasks...) lives in a compact tab strip in the
// side column, so working a customer never leaves this one panel.
export function CustomerWorkspace({ customerId: id, onChanged }) {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [sideTab, setSideTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  const { data: customer, loading, error, refetch } = useCustomer(id)
  const updateAction = useAction((values) => customersService.update(id, values))
  const deactivateAction = useAction(() => customersService.deactivate(id))
  const stageAction = useAction((stage) => customersService.setStage(id, stage))
  const [employees, setEmployees] = useState([])
  // sideTab is in the deps so leaving the "Buyurtma" tab (where
  // DealItemsEditor mutates items — and, via syncDealValue, deal.value —
  // outside this component's own actions) picks up the fresh total for the
  // summary tiles/PaymentForm without needing DealItemsEditor to expose an
  // onChange hook.
  const { data: dealsData } = useAsync(() => customersService.getDeals(id), [id, refreshKey, sideTab])
  const customerDeals = dealsData?.items ?? []
  // "Buyurtma" — mijozning eng birinchi/asosiy savdosi: bir mijoz uchun bir
  // vaqtda bitta faol buyurtma degan sodda modelga mos, ko'p savdo tarixi
  // esa Savdolar tab'ida to'liq ko'rinadi.
  const primaryDeal = customerDeals[0] || null
  const createOrderAction = useAction((payload) => dealsService.create(payload))
  // Cheap counts for the side-tab labels (section 14: "Savdolar: 2,
  // To'lovlar: 3..." at a glance) — separate from each tab's own RelatedList
  // fetch, which still owns the actual list rendering.
  const { data: paymentsCountData } = useAsync(() => customersService.getPayments(id), [id, refreshKey])
  const { data: tasksCountData } = useAsync(() => customersService.getTasks(id), [id, refreshKey])
  const { data: installationsCountData } = useAsync(() => customersService.getInstallations(id), [id, refreshKey])

  const paymentModal = useDisclosure()
  const createPaymentAction = useAction(paymentsService.create)

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    setSideTab('overview')
    setIsEditing(false)
  }, [id])

  const handleUpdate = async (values, businessPayload) => {
    try {
      await updateAction.run(values)
      if (businessPayload) {
        await businessesService.create({ ...businessPayload, customerId: id })
      }
      toast.success('Mijoz ma’lumotlari yangilandi')
      setIsEditing(false)
      refetch()
      bump()
      onChanged?.()
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

  const handleChangeStage = async (stage) => {
    if (stage === customer.stage) return
    try {
      await stageAction.run(stage)
      toast.success(`Status: ${CUSTOMER_STAGE_LABELS[stage]}`)
      refetch()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Statusni yangilashda xatolik yuz berdi')
    }
  }

  const handleCreateOrder = async () => {
    try {
      await createOrderAction.run({
        name: `${customer.name} — buyurtma`,
        customerId: id,
        businessId: customer.business?.id,
        stage: 'NEW',
      })
      toast.success('Buyurtma yaratildi')
      bump()
    } catch (err) {
      toast.error(err.message || 'Buyurtma yaratishda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading" style={{ width: '100%' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div style={{ padding: 24, width: '100%' }}>
        <Alert variant="danger" title="Mijoz topilmadi">
          {error?.message || 'Bu mijoz mavjud emas yoki o‘chirilgan.'}
        </Alert>
      </div>
    )
  }

  const customerAmount = getCustomerAmount(customer)
  const primaryProgram = customer.programs?.[0]?.name || '-'

  const header = (
    <div className="customer-workspace__header">
      <div className="customer-workspace__identity">
        <Avatar name={customer.name} size="lg" />
        <div>
          <div className="customer-workspace__name">{customer.name}</div>
          <div className="customer-workspace__meta">
            {customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}
            {customer.business?.name && <span> · {customer.business.name}</span>}
            {customer.assignedEmployee?.name && <span> · Mas'ul: {customer.assignedEmployee.name}</span>}
            <Dropdown
              trigger={(toggle) => (
                <button type="button" className="customer-workspace__stage-trigger" onClick={toggle}>
                  <Badge variant={CUSTOMER_STAGE_BADGE_VARIANTS[customer.stage] || 'gray'}>
                    {CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage}
                  </Badge>
                </button>
              )}
              align="left"
            >
              {CUSTOMER_STAGES.map((stage) => (
                <DropdownItem key={stage} onClick={() => handleChangeStage(stage)}>
                  {CUSTOMER_STAGE_LABELS[stage]}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
          <div className="customer-workspace__facts">
            <span>
              Stage: <strong>{CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage || '-'}</strong>
            </span>
            <span>
              Savdo summasi: <strong>{customerAmount > 0 ? formatCustomerAmount(customerAmount) : 'Belgilanmagan'}</strong>
            </span>
            <span>
              Mas'ul: <strong>{customer.assignedEmployee?.name || '-'}</strong>
            </span>
            <span>
              Dastur: <strong>{primaryProgram}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="customer-workspace__actions">
        {customer.phone && (
          <a className="btn btn--secondary" href={`tel:${customer.phone}`}>
            <PhoneIcon width={15} height={15} /> Telefon
          </a>
        )}
        <PermissionGate permission="customers.edit">
          <Button variant="secondary" onClick={() => setSideTab('programs')}>
            + Dastur
          </Button>
        </PermissionGate>
        <ScheduleFollowUpButton entityName={customer.name} context={{ customerId: id }} label="+ Vazifa" onCreated={bump} />
        <PermissionGate permission="customers.edit">
          <Button
            onClick={() => {
              setIsEditing(true)
            }}
          >
            Tahrirlash
          </Button>
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
  )

  if (isEditing) {
    return (
      <div className="customer-workspace">
        {header}
        <div className="customer-workspace__edit">
          <Card title="Ma'lumotlarni tahrirlash">
            <CustomerForm
              initialValues={customer}
              employees={employees}
              submitLabel="Saqlash"
              loading={updateAction.loading}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </Card>
        </div>
      </div>
    )
  }

  const tabCounts = {
    programs: customer.programs?.length,
    deals: customerDeals.length,
    payments: paymentsCountData?.total,
    tasks: tasksCountData?.total,
    installations: installationsCountData?.total,
  }
  const sideTabs = BASE_SIDE_TABS.map((tab) =>
    tabCounts[tab.id] != null ? { ...tab, label: `${tab.label} (${tabCounts[tab.id]})` } : tab
  )

  return (
    <div className="customer-workspace">
      {header}
      <div className="customer-workspace__body">
        <div className="customer-workspace__main">
          <MessagesPanel customerId={id} variant="flush" />
        </div>
        <div className="customer-workspace__side">
          <CustomerSummaryTiles
            programs={customer.programs || []}
            deal={primaryDeal}
            payments={paymentsCountData?.items ?? []}
            installationStatus={installationsCountData?.items?.at?.(-1)?.status}
            taskCount={tasksCountData?.total}
          />
          <Tabs items={sideTabs} activeId={sideTab} onChange={setSideTab} />
          <div className="customer-workspace__side-content">
            {sideTab === 'overview' && (
              <div className="stack">
                <Card title="Umumiy ma'lumot">
                  <div className="detail-grid">
                    <div className="detail-field">
                      <div className="detail-field__label">Stage</div>
                      <div className="detail-field__value">{CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage || '-'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field__label">Savdo summasi</div>
                      <div className="detail-field__value">{customerAmount > 0 ? formatCustomerAmount(customerAmount) : 'Belgilanmagan'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field__label">Dastur</div>
                      <div className="detail-field__value">{primaryProgram}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field__label">Mas'ul xodim</div>
                      <div className="detail-field__value">{customer.assignedEmployee?.name || '-'}</div>
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
                <HistorySection entityType="customer" entityId={id} title="Mijozning to‘liq tarixi" key={`history-${refreshKey}`} />
              </div>
            )}

            {sideTab === 'programs' && (
              <ProgramsPanel
                customerId={id}
                programs={customer.programs || []}
                employees={employees}
                onChanged={() => {
                  refetch()
                  bump()
                }}
              />
            )}

            {sideTab === 'order' && (
              <>
                {primaryDeal ? (
                  <DealItemsEditor dealId={primaryDeal.id} />
                ) : (
                  <Card
                    title="Buyurtma"
                    actions={
                      <PermissionGate permission="deals.create">
                        <Button size="sm" onClick={handleCreateOrder} loading={createOrderAction.loading}>
                          <PlusIcon width={14} height={14} /> Buyurtma yaratish
                        </Button>
                      </PermissionGate>
                    }
                  >
                    <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Hali buyurtma yo‘q" description="Dastur/mahsulot qo‘shish uchun avval buyurtma yarating." />
                  </Card>
                )}
              </>
            )}

            {sideTab === 'leads' && (
              <RelatedList
                title="Murojaatlar"
                fetcher={() => customersService.getLeads(id)}
                deps={[id]}
                linkTo={(item) => `/admin/crm/leads/${item.id}`}
                renderItem={(item) => <span>{item.title}</span>}
                emptyHint="Bu mijoz uchun hali murojaat yaratilmagan."
              />
            )}

            {sideTab === 'deals' && (
              <RelatedList
                title="Savdolar"
                fetcher={() => customersService.getDeals(id)}
                deps={[id, refreshKey]}
                linkTo={(item) => `/admin/crm/deals/${item.id}`}
                renderItem={(item) => <span>{item.name}</span>}
                emptyHint="Bu mijoz uchun hali savdo yaratilmagan."
              />
            )}

            {sideTab === 'payments' && (
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
                          <PlusIcon width={14} height={14} /> To‘lov
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

            {sideTab === 'tasks' && (
              <RelatedList
                title="Vazifalar"
                fetcher={() => customersService.getTasks(id)}
                deps={[id, refreshKey]}
                renderItem={(item) => <span>{item.title}</span>}
                emptyHint="Bu mijoz bilan bog‘liq vazifa yo‘q."
              />
            )}

            {sideTab === 'activities' && (
              <ActivitiesSection fetcher={() => customersService.getActivities(id)} deps={[id, refreshKey]} context={{ customerId: id }} />
            )}

            {sideTab === 'installations' && (
              <InstallationsPanel
                customerId={id}
                deals={customerDeals}
                employees={employees}
                onChanged={() => {
                  refetch()
                  bump()
                }}
              />
            )}

            {sideTab === 'attachments' && <AttachmentsSection entityType="customer" entityId={id} />}

            {sideTab === 'comments' && <CommentsSection entityType="customer" entityId={id} />}
          </div>
        </div>
      </div>

      <Modal open={paymentModal.isOpen} title="To‘lov qo‘shish" onClose={paymentModal.close}>
        <PaymentForm
          deals={customerDeals}
          submitLabel="Saqlash"
          loading={createPaymentAction.loading}
          onSubmit={handleRecordPayment}
          onCancel={paymentModal.close}
        />
      </Modal>
    </div>
  )
}
