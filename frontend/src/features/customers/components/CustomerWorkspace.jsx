import { useCallback, useEffect, useRef, useState } from 'react'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { CustomerForm, CustomerLocationPreview, formatAddress } from './CustomerForm'
import { formatCustomerAmount, getCustomerAmount } from '../customerAmount'
import { canViewCustomerField, canViewCustomerFinancials } from '../financialPermissions'
import { CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS, CUSTOMER_STAGE_BADGE_VARIANTS } from '../customers.constants'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { Badge } from '../../../components/Badge/Badge'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { PermissionGate } from '../../roles/PermissionGate'
import { usePermissions } from '../../roles/usePermissions'
import { useAuth } from '../../auth/useAuth'
import { CustomerWorkPanel } from './CustomerWorkActions'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { MoreIcon, PhoneIcon } from '../../../components/icons/Icons'
import './CustomerWorkspace.scss'

function normalizeStageOptions(stages, currentStage) {
  const source = Array.isArray(stages) && stages.length ? stages : CUSTOMER_STAGES
  const options = source
    .map((stage) => {
      const id = typeof stage === 'object' ? stage?.id : stage
      if (!id) return null
      return {
        id,
        label: typeof stage === 'object' ? stage.label || CUSTOMER_STAGE_LABELS[id] || id : CUSTOMER_STAGE_LABELS[id] || id,
      }
    })
    .filter(Boolean)

  if (currentStage && !options.some((stage) => stage.id === currentStage)) {
    options.push({ id: currentStage, label: CUSTOMER_STAGE_LABELS[currentStage] || currentStage })
  }
  return options
}

function formatWorkspaceDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function workspaceErrorTitle(error) {
  if (error?.status === 403) return 'Ruxsat yo‘q'
  if (error?.status === 404) return 'Mijoz topilmadi'
  return 'Mijozni yuklab bo‘lmadi'
}

function CompactCustomerOverview({ customer, canViewAmount, canViewDeposit, customerAmount, primaryProgram, address, payments = [] }) {
  const paidTotal = payments
    .filter((payment) => ['PAID', 'COMPLETED'].includes(payment.status))
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  const reminder = customer.nextReminder || customer.nextAction
  const latestNote = customer.latestNote?.message
  const latestActivity = customer.latestActivity?.message

  return (
    <div className="customer-workspace__compact-overview">
      <div className="customer-workspace__number-grid">
        {canViewAmount && customerAmount > 0 && <div className="customer-workspace__number-card"><span>Savdo summasi</span><strong>{formatCustomerAmount(customerAmount, customer.currency)}</strong></div>}
        {canViewDeposit && customer.depositAmount != null && <div className="customer-workspace__number-card"><span>Zaklad summasi</span><strong>{formatCustomerAmount(customer.depositAmount, customer.currency)}</strong></div>}
        {paidTotal > 0 && <div className="customer-workspace__number-card"><span>To‘langan</span><strong>{formatCustomerAmount(paidTotal, customer.currency)}</strong></div>}
      </div>

      <div className="customer-workspace__next-work">
        <div className="customer-workspace__section-label">Keyingi ish</div>
        {reminder ? (
          <div className={customer.isFollowUpOverdue ? 'customer-workspace__next-work-item customer-workspace__next-work-item--overdue' : 'customer-workspace__next-work-item'}>
            <strong>{reminder.title || (reminder.type === 'FOLLOW_UP' ? 'Qayta aloqa' : 'Eslatma')}</strong>
            <span>{formatWorkspaceDate(reminder.remindAt || reminder.at)}</span>
            {reminder.note && <small>{reminder.note}</small>}
          </div>
        ) : <span className="text-muted text-xs">Keyingi aloqa belgilanmagan</span>}
      </div>

      <Card title="Qisqa ma’lumot">
        <div className="customer-workspace__short-info">
          {customer.businessType?.name && <div><span>Biznes turi</span><strong>{customer.businessType.name}</strong></div>}
          {primaryProgram && <div><span>Dastur/xizmat</span><strong>{primaryProgram}</strong></div>}
          {address && <div><span>Manzil</span><strong>{address}</strong></div>}
        </div>
        <CustomerLocationPreview customer={customer} />
      </Card>

      {(latestNote || latestActivity) && <div className="customer-workspace__latest-activity">
        <div className="customer-workspace__section-label">Oxirgi activity</div>
        {latestNote && <div>Oxirgi izoh: <strong>{latestNote}</strong></div>}
        {!latestNote && latestActivity && <div>{latestActivity}</div>}
      </div>}
    </div>
  )
}

function useWorkspaceCustomer(id, initialCustomer) {
  const [data, setData] = useState(initialCustomer || null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!initialCustomer)
  const requestId = useRef(0)

  const refetch = useCallback(async () => {
    if (!id) {
      const invalidIdError = new Error('Mijoz ID topilmadi')
      invalidIdError.status = 400
      setData(null)
      setError(invalidIdError)
      setLoading(false)
      return null
    }

    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      const result = await customersService.get(id)
      if (requestId.current === currentRequest) setData(result)
      return result
    } catch (requestError) {
      if (requestId.current === currentRequest) setError(requestError)
      throw requestError
    } finally {
      if (requestId.current === currentRequest) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const hasMatchingInitialCustomer = initialCustomer?.id && String(initialCustomer.id) === String(id)
    if (hasMatchingInitialCustomer) {
      setData(initialCustomer)
      setError(null)
      setLoading(false)
      return
    }

    setData(null)
    refetch().catch(() => {})
  }, [id, initialCustomer, refetch])

  return { data, error, loading, refetch }
}

export function CustomerWorkspace({ customerId: id, initialCustomer, stages, onChanged, onDelete, onBack, startEditing = false }) {
  const toast = useToast()
  const confirm = useConfirm()
  const { can } = usePermissions()
  const { user } = useAuth()
  const isPartner = user?.role === 'PARTNER'
  const canViewFinancials = canViewCustomerFinancials(user)
  const canViewAmount = canViewCustomerField(user, 'amount')
  const canViewDeposit = canViewCustomerField(user, 'deposit')
  const canEditCore = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || can('customers.editCore')
  const canEditStage = !isPartner && (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || can('customers.edit'))
  const [isEditing, setIsEditing] = useState(startEditing)

  const { data: customer, loading, error, refetch } = useWorkspaceCustomer(id, initialCustomer)
  const stageOptions = normalizeStageOptions(stages, customer?.stage)
  const updateAction = useAction((values) => customersService.update(id, values))
  const deactivateAction = useAction(() => customersService.deactivate(id))
  const stageAction = useAction((stage) => customersService.setStage(id, typeof stage === 'object' ? stage?.id || stage?.stageId || stage?.value : stage))
  const [employees, setEmployees] = useState([])
  const { data: paymentsData } = useAsync(() => canViewFinancials ? customersService.getPayments(id) : Promise.resolve(null), [id, canViewFinancials])
  const paymentItems = Array.isArray(paymentsData?.items) ? paymentsData.items : Array.isArray(paymentsData) ? paymentsData : []

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((employee) => employee.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    setIsEditing(Boolean(startEditing))
  }, [id, startEditing])

  const handleUpdate = async (values, businessPayload) => {
    try {
      await updateAction.run(values)
      if (businessPayload) await businessesService.create({ ...businessPayload, customerId: id })
      toast.success('Mijoz ma’lumotlari yangilandi')
      setIsEditing(false)
      refetch()
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

  const handleChangeStage = async (stage) => {
    if (stage === customer.stage) return
    try {
      await stageAction.run(stage)
      toast.success(`Status: ${CUSTOMER_STAGE_LABELS[stage] || stage}`)
      await refetch()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Statusni yangilashda xatolik yuz berdi')
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
        <Alert variant="danger" title={workspaceErrorTitle(error)}>
          {error?.message || 'Mijoz ma’lumotlari mavjud emas.'}
        </Alert>
      </div>
    )
  }

  const customerAmount = getCustomerAmount(customer)
  const customerPrograms = Array.isArray(customer.programs) ? customer.programs : []
  const primaryProgram = customer.service || customerPrograms[0]?.name || ''
  const address = formatAddress(customer.address)

  const header = (
    <div className="customer-workspace__header">
      <div className="customer-workspace__identity">
        <Avatar name={customer.name} size="lg" />
        <div>
          <div className="customer-workspace__name">{customer.name}</div>
          <div className="customer-workspace__meta">
            {customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}
            {customer.businessType?.name && <span> · {customer.businessType.name}</span>}
            {customer.business?.name && <span> · {customer.business.name}</span>}
            {customer.assignedEmployee?.name && <span> · Mas'ul: {customer.assignedEmployee.name}</span>}
            {!canEditStage ? (
              <Badge variant={CUSTOMER_STAGE_BADGE_VARIANTS[customer.stage] || 'gray'}>
                {CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage}
              </Badge>
            ) : <Dropdown
              trigger={(toggle) => (
                <button type="button" className="customer-workspace__stage-trigger" onClick={toggle} aria-label="Bosqichni o'zgartirish" title="Bosqichni o'zgartirish">
                  <span className="customer-workspace__stage-trigger-label">Bosqich</span>
                  <Badge variant={CUSTOMER_STAGE_BADGE_VARIANTS[customer.stage] || 'gray'}>
                    {CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage}
                  </Badge>
                  <span aria-hidden="true">⌄</span>
                </button>
              )}
              align="left"
            >
              {stageOptions.map((stage) => (
                <DropdownItem key={stage.id} onClick={() => handleChangeStage(stage.id)}>
                  {stage.label}
                </DropdownItem>
              ))}
            </Dropdown>}
          </div>
          <div className="customer-workspace__facts">
            <span>Stage: <strong>{CUSTOMER_STAGE_LABELS[customer.stage] || customer.stage || '-'}</strong></span>
            {customer.status && <span>Status: <strong>{customer.status === 'active' ? 'Faol' : 'Nofaol'}</strong></span>}
            {canViewAmount && customerAmount > 0 && <span><strong>{formatCustomerAmount(customerAmount, customer.currency)}</strong></span>}
            <span>Mas'ul: <strong>{customer.assignedEmployee?.name || ''}</strong></span>
            {primaryProgram && <span>Dastur: <strong>{primaryProgram}</strong></span>}
          </div>
          <div className="customer-workspace__created-meta">
            {customer.createdBy?.name && <span>Qo‘shgan: <strong>{customer.createdBy.name}</strong></span>}
            {customer.createdAt && <span>Qo‘shilgan sana: <strong>{formatWorkspaceDate(customer.createdAt)}</strong></span>}
          </div>
        </div>
      </div>
      <div className="customer-workspace__actions">
        {onBack && <Button variant="secondary" onClick={onBack}>Ortga</Button>}
        {customer.phone && <a className="btn btn--secondary" href={`tel:${customer.phone}`}><PhoneIcon width={15} height={15} /> Telefon</a>}
        {canEditCore && <button type="button" className="customer-workspace__edit-button" onClick={() => setIsEditing(true)} aria-label="Asosiy ma'lumotlarni tahrirlash" title="Tahrirlash">✎</button>}
        {!isPartner && <Dropdown
          trigger={(toggle) => (
            <button type="button" className="header__icon-btn" onClick={toggle} aria-label="Boshqa amallar">
              <MoreIcon width={18} height={18} />
            </button>
          )}
        >
          <PermissionGate permission="customers.delete">
            <DropdownItem onClick={handleDeactivate}>{customer.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}</DropdownItem>
          </PermissionGate>
          {onDelete && <PermissionGate permission="customers.delete"><DropdownItem danger onClick={onDelete}>O‘chirish</DropdownItem></PermissionGate>}
        </Dropdown>}
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
              canManageGroups={can('customers.edit')}
              canEditCore={canEditCore}
              canViewFinancials={canViewFinancials}
              canViewAmount={canViewAmount}
              canViewDeposit={canViewDeposit}
            />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-workspace">
      {header}
      <div className="customer-workspace__body">
        <div className="customer-workspace__main">
          <CompactCustomerOverview
            customer={customer}
            canViewAmount={canViewAmount}
            canViewDeposit={canViewDeposit}
            customerAmount={customerAmount}
            primaryProgram={primaryProgram}
            address={address}
            payments={paymentItems}
          />
          {!isPartner && <CustomerWorkPanel customer={customer} onChanged={() => { refetch(); onChanged?.() }} />}
        </div>
      </div>
    </div>
  )
}
