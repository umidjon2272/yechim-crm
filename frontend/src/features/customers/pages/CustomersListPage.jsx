import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomer, useCustomers } from '../customers.hooks'
import { customersService, customerGroupsService, partnersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { CustomerTable } from '../components/CustomerTable'
import { CustomerKanbanCard } from '../components/CustomerKanbanCard'
import { CustomerForm } from '../components/CustomerForm'
import { CreateStageModal } from '../components/CreateStageModal'
import { CustomerGroupsBar } from '../components/CustomerGroupsBar'
import { formatCustomerCurrencyAmount } from '../customerAmount'
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABELS, CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS } from '../customers.constants'
import { INSTALLATION_STATUSES, INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { NumberInput } from '../../../components/NumberInput/NumberInput'
import { Select } from '../../../components/Select/Select'
import { FormField } from '../../../components/FormField/FormField'
import { Modal } from '../../../components/Modal/Modal'
import { Card } from '../../../components/Card/Card'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { KanbanBoard } from '../../../components/Kanban/KanbanBoard'
import { PermissionGate } from '../../roles/PermissionGate'
import { usePermissions } from '../../roles/usePermissions'
import { useAuth } from '../../auth/useAuth'
import { useToast } from '../../../store/ToastContext'
import { useConfirm } from '../../../store/ConfirmContext'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { EditIcon, InboxIcon, PlusIcon, SearchIcon, TrashIcon } from '../../../components/icons/Icons'
import { CustomerWorkPanel, QuickActionModal, ReminderModal } from '../components/CustomerWorkActions'
import { TodayWorkPanel } from '../components/TodayWorkPanel'
import { CustomerGroupsField } from '../components/CustomerGroupsField'
import { classNames } from '../../../utils/classNames'
import { canViewCustomerField, canViewCustomerFinancials, canViewPipelineTotal as canViewCustomerPipelineTotal } from '../financialPermissions'
import './CustomersListPage.scss'

function fallbackStages() {
  return CUSTOMER_STAGES.map((stage) => ({ id: stage, label: CUSTOMER_STAGE_LABELS[stage], isSystem: true, isDefault: true, isProtected: true }))
}

function formatPartnerPeriod(period) {
  const [year, month] = String(period || '').split('-').map(Number)
  if (!year || !month) return period
  const label = new Intl.DateTimeFormat('uz-UZ', { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, 1)))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function CustomerEditModal({ customerId, employees, stages, loadingStages, readOnly = false, canViewFinancials = true, canViewAmount = true, canViewDeposit = true, onClose, onChanged }) {
  const toast = useToast()
  const confirm = useConfirm()
  const { can } = usePermissions()
  const { data: customer, loading, error, refetch } = useCustomer(customerId)
  const updateAction = useAction((values) => customersService.update(customerId, values))
  const deleteAction = useAction(() => customersService.remove(customerId))

  const handleUpdate = async (customerPayload, businessPayload) => {
    try {
      await updateAction.run(customerPayload)
      if (businessPayload) await businessesService.create({ ...businessPayload, customerId })
      toast.success('Mijoz maʼlumotlari saqlandi')
      await refetch()
      onChanged?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Mijozni saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Mijozni o\'chirish',
      description: 'Bu mijozni o\'chirmoqchimisiz?',
      confirmLabel: 'O\'chirish',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAction.run()
      toast.success('Mijoz arxivlandi')
      await onChanged?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Mijozni o\'chirishda xatolik yuz berdi')
    }
  }

  return (
    <Modal open={!!customerId} title={customer?.name || 'Mijoz'} className="customer-edit-modal" onClose={onClose}>
      {loading && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}
      {error && (
        <Alert variant="danger" title="Mijozni ochib bo'lmadi">
          {error.message}
        </Alert>
      )}
      {!loading && !error && customer && readOnly && (
        <div className="detail-grid">
          <div className="detail-field"><div className="detail-field__label">Mijoz</div><div className="detail-field__value">{customer.name}</div></div>
          <div className="detail-field"><div className="detail-field__label">Telefon</div><div className="detail-field__value">{customer.phone || '—'}</div></div>
          <div className="detail-field"><div className="detail-field__label">Bosqich</div><div className="detail-field__value">{customer.stageLabel || customer.stage}</div></div>
          <div className="detail-field"><div className="detail-field__label">Holat</div><div className="detail-field__value">{customer.isCompleted ? 'Yakunlangan' : 'Jarayonda'}</div></div>
          <div className="detail-field"><div className="detail-field__label">O‘rnatish</div><div className="detail-field__value">{customer.isInstalled ? 'O‘rnatildi' : 'O‘rnatilmadi'}</div></div>
        </div>
      )}
      {!loading && !error && customer && !readOnly && (
        <>
          <CustomerForm
            initialValues={customer}
            employees={employees}
            stages={stages}
            submitLabel="Saqlash"
            loading={updateAction.loading || loadingStages || deleteAction.loading}
            onSubmit={handleUpdate}
            onCancel={onClose}
            onDelete={handleDelete}
            canManageGroups={!readOnly}
            canViewFinancials={canViewFinancials}
            canViewAmount={canViewAmount}
            canViewDeposit={canViewDeposit}
          />
          <Card title="Guruhlar" className="customer-edit-modal__groups-card">
            <CustomerGroupsField customer={customer} onChanged={async () => { await refetch(); onChanged?.() }} />
          </Card>
          <CustomerWorkPanel customer={customer} onChanged={refetch} />
        </>
      )}
    </Modal>
  )
}

function BulkMoveModal({ open, selectedCount, stages, activeGroupId, loading, onClose, onSubmit }) {
  const { data } = useAsync(() => customerGroupsService.list({ pageSize: 100 }), [])
  const groups = data?.items ?? []
  const [stage, setStage] = useState('')
  const [targetGroupId, setTargetGroupId] = useState('')

  useEffect(() => {
    if (open) {
      setStage('')
      setTargetGroupId('')
    }
  }, [open])

  return (
    <Modal
      open={open}
      title="Boshqa voronkaga o'tkazish"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Bekor qilish
          </Button>
          <Button loading={loading} disabled={!stage && !targetGroupId} onClick={() => onSubmit({ stage, targetGroupId, fromGroupId: activeGroupId })}>
            O'tkazish
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="text-muted">{selectedCount} ta mijoz tanlandi.</p>
        <Select value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>
          <option value="">Group o'zgarmasin</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        <Select value={stage} onChange={(event) => setStage(event.target.value)}>
          <option value="">Bosqich o'zgarmasin</option>
          {stages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

function DepositPromptModal({ move, loading, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (move) setAmount(move.customer.depositAmount ?? '')
  }, [move])

  if (!move) return null

  return (
    <Modal
      open
      title="Zaklad summasi"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Bekor qilish</Button>
          <Button onClick={() => onSubmit(amount)} loading={loading}>Stage'ni saqlash</Button>
        </>
      }
    >
      <p className="text-muted" style={{ marginBottom: 16 }}>
        {move.customer.name} mijozini "Zaklad olingan" stage'iga o'tkazyapsiz. Zaklad summasini kiriting.
      </p>
      <FormField label="Zaklad summasi" hint="Ixtiyoriy">
        <NumberInput min="0" step="1000" value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus />
      </FormField>
    </Modal>
  )
}

function FollowUpPromptModal({ move, loading, onClose, onSubmit }) {
  const [remindAt, setRemindAt] = useState('')
  useEffect(() => {
    if (move) {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      date.setHours(14, 0, 0, 0)
      const pad = (value) => String(value).padStart(2, '0')
      setRemindAt(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`)
    }
  }, [move])
  if (!move) return null
  const quick = (days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(14, 0, 0, 0)
    const pad = (value) => String(value).padStart(2, '0')
    setRemindAt(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`)
  }
  return <Modal open title="Qachon qayta aloqaga chiqamiz?" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={() => onSubmit(remindAt)} loading={loading} disabled={!remindAt}>Saqlash</Button></>}>
    <p className="text-muted">{move.customer.name} uchun keyingi aloqa vaqtini tanlang.</p>
    <div className="quick-date-row">
      <Button size="sm" variant="secondary" onClick={() => quick(1)}>Ertaga</Button>
      <Button size="sm" variant="secondary" onClick={() => quick(3)}>3 kun</Button>
      <Button size="sm" variant="secondary" onClick={() => quick(7)}>1 hafta</Button>
    </div>
    <FormField label="Sana va vaqt"><Input type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} /></FormField>
  </Modal>
}

function InstallationPromptModal({ move, employees, loading, onClose, onSubmit }) {
  const [installationAt, setInstallationAt] = useState('')
  const [installerEmployeeId, setInstallerEmployeeId] = useState('')
  useEffect(() => {
    if (move) {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      date.setHours(10, 0, 0, 0)
      const pad = (value) => String(value).padStart(2, '0')
      setInstallationAt(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`)
      setInstallerEmployeeId(move.customer.installerEmployeeId || '')
    }
  }, [move])
  if (!move) return null
  return <Modal open title="O'rnatishni rejalash" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={() => onSubmit({ installationAt, installerEmployeeId })} loading={loading} disabled={!installationAt}>Saqlash</Button></>}>
    <p className="text-muted">{move.customer.name} uchun o'rnatish sanasi va o'rnatuvchini tanlang.</p>
    <div className="detail-grid">
      <FormField label="O'rnatish sanasi"><Input type="datetime-local" value={installationAt} onChange={(event) => setInstallationAt(event.target.value)} /></FormField>
      <FormField label="O'rnatuvchi"><Select value={installerEmployeeId} onChange={(event) => setInstallerEmployeeId(event.target.value)}><option value="">Tanlang</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</Select></FormField>
    </div>
  </Modal>
}

function PartnerSummaryCard() {
  const [range, setRange] = useState('currentMonth')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const query = useMemo(() => range === 'custom' ? { from: custom.from, to: custom.to } : { range }, [range, custom.from, custom.to])
  const { data, loading, error } = useAsync(() => partnersService.myStatistics(query), [query.range, query.from, query.to])

  if (error) return <Alert variant="danger" title="Partner statistikasini yuklab bo'lmadi">{error.message}</Alert>
  if (loading || !data) return null

  return (
    <Card title={`${data.group?.name || 'Partner'} — ${formatPartnerPeriod(data.period)}`}>
      <div className="partner-summary__filters">
        {[['today', 'Bugun'], ['7d', '7 kun'], ['30d', '30 kun'], ['currentMonth', 'Shu oy'], ['previousMonth', "O'tgan oy"], ['custom', 'Sana tanlash']].map(([value, label]) => <Button key={value} type="button" size="sm" variant={range === value ? 'primary' : 'secondary'} onClick={() => setRange(value)}>{label}</Button>)}
      </div>
      {range === 'custom' && <div className="partner-summary__custom-filter"><FormField label="Dan"><Input type="date" value={custom.from} onChange={(event) => setCustom((current) => ({ ...current, from: event.target.value }))} /></FormField><FormField label="Gacha"><Input type="date" value={custom.to} onChange={(event) => setCustom((current) => ({ ...current, to: event.target.value }))} /></FormField></div>}
      <div className="detail-grid">
        <div className="detail-field"><div className="detail-field__label">Kelgan mijozlar</div><div className="detail-field__value">{data.newCustomers}</div></div>
        <div className="detail-field"><div className="detail-field__label">Reward olganlar</div><div className="detail-field__value">{data.rewardedCustomers ?? data.completedCustomers}</div></div>
        <div className="detail-field"><div className="detail-field__label">Jami reward</div><div className="detail-field__value">${Number(data.totalReward ?? data.payableAmount ?? 0).toLocaleString('en-US')}</div></div>
      </div>
      {data.history?.length > 0 && (
        <div className="stack" style={{ marginTop: 16 }}>
          <strong>Oylar tarixi</strong>
          {data.history.slice(0, 6).map((item) => <div key={item.period} className="text-muted text-xs">{formatPartnerPeriod(item.period)}: {item.completedCustomers} ta — ${Number(item.payableAmount || 0).toLocaleString('en-US')}</div>)}
        </div>
      )}
    </Card>
  )
}

function StageDeleteModal({ stageDelete, stages, loading, onClose, onSubmit }) {
  const [replacementStageId, setReplacementStageId] = useState('')
  const alternatives = stages.filter((stage) => stage.id !== stageDelete?.stage?.id)

  useEffect(() => {
    setReplacementStageId(alternatives[0]?.id || '')
  }, [stageDelete?.stage?.id])

  if (!stageDelete) return null
  const needsReplacement = stageDelete.count > 0

  return (
    <Modal
      open
      title="Bosqichni o'chirish"
      onClose={onClose}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Bekor qilish</Button>
        <Button type="button" variant="danger" loading={loading} disabled={needsReplacement && !replacementStageId} onClick={() => onSubmit(needsReplacement ? replacementStageId : undefined)}>O'chirish</Button>
      </>}
    >
      <p>{stageDelete.count > 0 ? `${stageDelete.count} ta mijoz bor. Ularni qaysi bosqichga o'tkazamiz?` : "Bu bosqichdagi mijozlar yo'q."}</p>
      {needsReplacement && <Select value={replacementStageId} onChange={(event) => setReplacementStageId(event.target.value)}>
        {alternatives.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
      </Select>}
    </Modal>
  )
}

function InlineStageTitle({ column, canEdit, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(column.label)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setValue(column.label)
  }, [column.label, editing])

  const save = async () => {
    const nextValue = value.trim()
    if (!nextValue || saving) {
      setEditing(false)
      return
    }
    setEditing(false)
    if (nextValue === column.label) return
    setSaving(true)
    try {
      await onSave(column, nextValue)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <span className="stage-inline-title stage-inline-title--editing">
        <Input
          className="stage-inline-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setValue(column.label)
              setEditing(false)
            }
          }}
          autoFocus
          disabled={saving}
          aria-label="Bosqich nomi"
        />
        <button type="button" className="stage-cancel-btn" onMouseDown={(event) => event.preventDefault()} onClick={() => { setValue(column.label); setEditing(false) }} aria-label="Bekor qilish">×</button>
        {onDelete && (
          <button
            type="button"
            className="stage-delete-btn"
            draggable="false"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onDelete(column)
            }}
            aria-label={`${column.label} bosqichini o'chirish`}
          >
            <TrashIcon width={14} height={14} />
          </button>
        )}
      </span>
    )
  }

  return (
    <span className="stage-inline-title">
      <span className="kanban__column-title">{column.label}</span>
      {canEdit && (
        <>
          <button
            type="button"
            className="stage-edit-btn"
            draggable="false"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setEditing(true)
            }}
            aria-label={`${column.label} nomini o'zgartirish`}
          >
            <EditIcon width={14} height={14} />
          </button>
          {onDelete && (
            <button
              type="button"
              className="stage-edit-btn stage-delete-btn"
              draggable="false"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onDelete(column)
              }}
              aria-label={`${column.label} bosqichini o'chirish`}
            >
              <TrashIcon width={14} height={14} />
            </button>
          )}
        </>
      )}
    </span>
  )
}

export function CustomersListPage() {
  const { id: routeCustomerId } = useParams()
  const navigate = useNavigate()
  const {
    view,
    setView,
    customers,
    total,
    params,
    setSearch,
    setStatus,
    setAssignedEmployeeId,
    setCity,
    setGroupId,
    setInstallationStatus,
    setCreatedTo,
    setSort,
    setPage,
    loading,
    error,
    refetch,
  } = useCustomers()
  const createModal = useDisclosure()
  const stageModal = useDisclosure()
  const bulkMoveModal = useDisclosure()
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [createStageId, setCreateStageId] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filterOptions, setFilterOptions] = useState({ cities: [], stageCounts: {}, stageTotals: {}, stages: fallbackStages() })
  const [stageDraft, setStageDraft] = useState({ afterStageId: null })
  const [stageDelete, setStageDelete] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [optimisticStages, setOptimisticStages] = useState({})
  const [depositMove, setDepositMove] = useState(null)
  const [followUpMove, setFollowUpMove] = useState(null)
  const [installationMove, setInstallationMove] = useState(null)
  const [quickAction, setQuickAction] = useState(null)
  const [quickCustomer, setQuickCustomer] = useState(null)
  const [reminderType, setReminderType] = useState(null)
  const [activeGroupName, setActiveGroupName] = useState('')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)
  const [mobileStageId, setMobileStageId] = useState('NEW')
  const toast = useToast()
  const { can } = usePermissions()
  const { user } = useAuth()
  const canViewEmployees = can('employees.view')
  const isPartner = user?.role === 'PARTNER'
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const canViewFinancials = canViewCustomerFinancials(user)
  const canViewAmount = canViewCustomerField(user, 'amount')
  const canViewDeposit = canViewCustomerField(user, 'deposit')
  const canViewPipelineTotal = canViewCustomerPipelineTotal(user)
  const canManageCustomerGroups = !isPartner && (isAdmin || user?.role !== 'EMPLOYEE')
  const canSeeAllCustomersTab = !user || user?.role !== 'EMPLOYEE' || user?.customerVisibility === 'ALL' || can('customers.viewAll')
  const handleGroupSelect = (groupId, group) => {
    setActiveGroupName(group?.name || '')
    setGroupId(groupId)
  }

  const createAction = useAction(async (customerPayload, businessPayload) => {
    const customer = await customersService.create(customerPayload)
    if (businessPayload) await businessesService.create({ ...businessPayload, customerId: customer.id })
    return customer
  })
  const deactivateAction = useAction((customer) => customersService.deactivate(customer.id))
  const moveStageAction = useAction(({ id, stage, ...payload }) => customersService.setStage(id, stage, payload))
  const saveStageAction = useAction((payload) =>
    payload.id ? customersService.updateStage(payload.id, payload.values) : customersService.createStage(payload.values)
  )
  const deleteStageAction = useAction(({ id, replacementStageId }) => customersService.deleteStage(id, { replacementStageId }))
  const bulkMoveAction = useAction((payload) => customersService.bulkMove(payload))

  const loadFilterOptions = useCallback(() => {
    Promise.all([
      customersService.getFilterOptions(),
      customersService.listStages().catch(() => ({ items: fallbackStages() })),
    ])
      .then(([res, stagesRes]) =>
        setFilterOptions({
          cities: res?.cities ?? [],
          stageCounts: res?.stageCounts ?? {},
          stageTotals: res?.stageTotals ?? {},
          stages: stagesRes?.items?.length ? stagesRes.items : fallbackStages(),
        })
      )
      .catch(() => setFilterOptions({ cities: [], stageCounts: {}, stageTotals: {}, stages: fallbackStages() }))
  }, [])

  useEffect(() => {
    loadFilterOptions()
    if (!canViewEmployees) {
      setEmployees([])
      return undefined
    }
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((employee) => employee.status === 'active')))
      .catch(() => setEmployees([]))
    return undefined
  }, [canViewEmployees, loadFilterOptions])

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => customers.some((customer) => customer.id === id))
      // Returning the existing state is important here: while data is being
      // fetched, `customers` can be empty and this effect must not create a
      // new array on every render.
      return next.length === current.length ? current : next
    })
  }, [customers])

  const stageColumns = useMemo(() => filterOptions.stages.map((stage) => ({ ...stage, id: stage.id, label: stage.label })), [filterOptions.stages])
  const stageLabels = useMemo(
    () => filterOptions.stages.reduce((acc, stage) => ({ ...acc, [stage.id]: stage.label }), { ...CUSTOMER_STAGE_LABELS }),
    [filterOptions.stages]
  )
  const displayedCustomers = useMemo(
    () => customers.map((customer) => (optimisticStages[customer.id] ? { ...customer, stage: optimisticStages[customer.id] } : customer)),
    [customers, optimisticStages]
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(media.matches)
    handleChange()
    media.addEventListener?.('change', handleChange)
    return () => media.removeEventListener?.('change', handleChange)
  }, [])

  useEffect(() => {
    if (isMobile) setView('kanban')
  }, [isMobile, setView])

  useEffect(() => {
    if (!stageColumns.some((stage) => stage.id === mobileStageId)) {
      setMobileStageId(stageColumns.find((stage) => stage.id === 'NEW')?.id || stageColumns[0]?.id || 'NEW')
    }
  }, [stageColumns, mobileStageId])

  const mobileStage = stageColumns.find((stage) => stage.id === mobileStageId) || stageColumns[0]
  const visibleStageColumns = isMobile && mobileStage ? [mobileStage] : stageColumns
  const visibleCustomers = isMobile && mobileStage ? displayedCustomers.filter((customer) => customer.stage === mobileStage.id) : displayedCustomers
  const activeCustomerId = selectedCustomerId || routeCustomerId

  const openCustomer = (customerId) => setSelectedCustomerId(customerId)
  const closeCustomer = () => {
    setSelectedCustomerId(null)
    if (routeCustomerId) navigate('/admin/crm/customers')
  }

  const handleCreate = async (customerPayload, businessPayload) => {
    try {
      const groupIds = Array.isArray(customerPayload.groupIds) ? customerPayload.groupIds : params.groupId ? [params.groupId] : []
      const result = await createAction.run({ ...customerPayload, groupIds }, businessPayload)
      toast.success("Mijoz qo'shildi")
      if (result?.quickActionErrors?.length) toast.error(`${result.quickActionErrors.length} ta keyingi ish saqlanmadi`)
      createModal.close()
      await refetch()
      loadFilterOptions()
    } catch (err) {
      toast.error(err.message || "Mijoz qo'shishda xatolik yuz berdi")
    }
  }

  const openCreateForStage = (stageId) => {
    setCreateStageId(stageId)
    createModal.open()
  }

  const handleStageMove = async (customer, fromStage, toStage) => {
    if (toStage === 'DEPOSIT_RECEIVED' && customer.depositAmount == null) {
      setDepositMove({ customer, fromStage, toStage })
      return
    }
    if (toStage === 'FOLLOW_UP') {
      setFollowUpMove({ customer, fromStage, toStage })
      return
    }
    if (toStage === 'INSTALLATION_REQUIRED') {
      setInstallationMove({ customer, fromStage, toStage })
      return
    }
    await performStageMove(customer, fromStage, toStage)
  }

  const performStageMove = async (customer, fromStage, toStage, depositAmount, extra = {}) => {
    setOptimisticStages((current) => ({ ...current, [customer.id]: toStage }))
    try {
      await moveStageAction.run({ id: customer.id, stage: toStage, depositAmount, ...extra })
      toast.success(`"${customer.name}" ${stageLabels[toStage] || toStage} bosqichiga o'tdi`)
      await refetch()
      loadFilterOptions()
    } catch (err) {
      setOptimisticStages((current) => ({ ...current, [customer.id]: fromStage }))
      toast.error(err.message || 'Bosqichni yangilashda xatolik yuz berdi')
    } finally {
      setOptimisticStages((current) => {
        const next = { ...current }
        delete next[customer.id]
        return next
      })
    }
  }

  const handleFollowUpMove = async (remindAt) => {
    const move = followUpMove
    setFollowUpMove(null)
    await performStageMove(move.customer, move.fromStage, move.toStage, undefined, { nextContactAt: new Date(remindAt).toISOString(), reminderType: 'FOLLOW_UP' })
  }

  const handleInstallationMove = async ({ installationAt, installerEmployeeId }) => {
    const move = installationMove
    setInstallationMove(null)
    await performStageMove(move.customer, move.fromStage, move.toStage, undefined, { installationAt: new Date(installationAt).toISOString(), installerEmployeeId })
  }

  const handleQuickAction = (action, customer) => {
    setQuickCustomer(customer)
    if (action === 'CALL') setReminderType('CALL')
    else if (action === 'REMINDER') setReminderType('REPEAT_SALE')
    else setQuickAction(action)
  }

  const closeQuickAction = () => {
    setQuickAction(null)
    setQuickCustomer(null)
    setReminderType(null)
  }

  const handleDepositMove = async (amount) => {
    const move = depositMove
    setDepositMove(null)
    await performStageMove(move.customer, move.fromStage, move.toStage, amount === '' ? null : Number(amount))
  }

  const openCreateStage = (afterStageId = null) => {
    setStageDraft({ afterStageId })
    stageModal.open()
  }

  const handleSaveStage = async (name) => {
    try {
      await saveStageAction.run({ values: { name, afterStageId: stageDraft.afterStageId } })
      toast.success('Bosqich yaratildi')
      stageModal.close()
      loadFilterOptions()
      await refetch()
    } catch (err) {
      toast.error(err.message || 'Bosqichni saqlashda xatolik yuz berdi')
    }
  }

  const handleRenameStage = async (stage, name) => {
    try {
      await saveStageAction.run({ id: stage.id, values: { name } })
      toast.success("Bosqich nomi o'zgartirildi")
      await loadFilterOptions()
    } catch (err) {
      toast.error(err.message || "Bosqich nomini saqlab bo'lmadi")
    }
  }

  const handleReorderStages = async (fromId, toId) => {
    const orderedIds = stageColumns.map((stage) => stage.id)
    const fromIndex = orderedIds.indexOf(fromId)
    const toIndex = orderedIds.indexOf(toId)
    if (fromIndex < 0 || toIndex < 0) return
    orderedIds.splice(fromIndex, 1)
    orderedIds.splice(toIndex, 0, fromId)
    try {
      await customersService.reorderStages(orderedIds)
      toast.success('Bosqich tartibi saqlandi')
      await loadFilterOptions()
    } catch (err) {
      toast.error(err.message || "Bosqich tartibini saqlab bo'lmadi")
    }
  }

  const handleMoveStage = async (stage, direction) => {
    try {
      await saveStageAction.run({ id: stage.id, values: { direction } })
      loadFilterOptions()
    } catch (err) {
      toast.error(err.message || 'Bosqich tartibini yangilab boʼlmadi')
    }
  }

  const openDeleteStage = (stage) => {
    if (stage.isSystem || stage.isDefault || stage.isProtected) {
      toast.error('Tizim/default bosqichini o\'chirib bo\'lmaydi')
      return
    }
    const count = Number.isFinite(Number(stage.customerCount)) ? Number(stage.customerCount) : displayedCustomers.filter((customer) => customer.stage === stage.id).length
    setStageDelete({ stage, count })
  }

  const handleDeleteStage = async (replacementStageId) => {
    try {
      await deleteStageAction.run({ id: stageDelete.stage.id, replacementStageId })
      toast.success("Bosqich o'chirildi")
      setStageDelete(null)
      loadFilterOptions()
      await refetch()
    } catch (err) {
      toast.error(err.message || "Bosqichni o'chirishda xatolik yuz berdi")
    }
  }

  const handleDeactivate = async (customer) => {
    try {
      await deactivateAction.run(customer)
      toast.success('Holat yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Holatni yangilashda xatolik yuz berdi')
    }
  }

  const toggleSelected = (id, checked) => {
    setSelectedIds((current) => (checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)))
  }

  const toggleAllVisible = (checked) => {
    setSelectedIds(checked ? customers.map((customer) => customer.id) : [])
  }

  const handleBulkMove = async ({ stage, targetGroupId, fromGroupId }) => {
    try {
      await bulkMoveAction.run({ customerIds: selectedIds, stage, targetGroupId, fromGroupId })
      toast.success("Mijozlar o'tkazildi")
      bulkMoveModal.close()
      setSelectedIds([])
      await refetch()
      loadFilterOptions()
    } catch (err) {
      toast.error(err.message || "Mijozlarni o'tkazishda xatolik yuz berdi")
    }
  }

  const handleCustomerChanged = async () => {
    await refetch()
    loadFilterOptions()
  }

  return (
    <div className="customers-page">
      <div className="page-header customers-page__header">
        <div className="page-header__actions">
          <div className="view-toggle">
            <button type="button" className={classNames('view-toggle__btn', view === 'kanban' && 'view-toggle__btn--active')} onClick={() => setView('kanban')}>
              Voronka
            </button>
            <button type="button" className={classNames('view-toggle__btn', view === 'list' && 'view-toggle__btn--active')} onClick={() => setView('list')}>
              Ro'yxat
            </button>
          </div>
        </div>
      </div>

      {!isPartner && (
           <CustomerGroupsBar
             activeGroupId={params.groupId}
             onSelectGroup={handleGroupSelect}
             showAllCustomers={canSeeAllCustomersTab}
             canCreate={isAdmin && can('customers.create')}
           canEdit={isAdmin && can('customers.edit')}
           canDelete={isAdmin && can('customers.delete')}
        />
      )}
      {!isPartner && params.groupId && <div className="customer-group-context-badge">{activeGroupName || 'Tanlangan guruh'} guruhi</div>}
      {isPartner && <PartnerSummaryCard />}

      {isMobile && (
        <div className="mobile-crm-toolbar">
          <label className="mobile-crm-toolbar__stage">
            <span>Bosqich:</span>
            <Select value={mobileStage?.id || 'NEW'} onChange={(event) => setMobileStageId(event.target.value)}>
              {stageColumns.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
            </Select>
          </label>
          {can('customers.create') && <Button onClick={() => openCreateForStage(mobileStage?.id || 'NEW')}>+ Mijoz</Button>}
        </div>
      )}

      <div className="filters-row customers-filter-row">
        <div className="input-group filters-row__search customers-filter-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Qidirish" value={params.search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {!isPartner && canViewEmployees && <Select value={params.assignedEmployeeId} onChange={(event) => setAssignedEmployeeId(event.target.value)}>
          <option value="">Xodim</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </Select>}
        {!isPartner && user && <Button variant={params.assignedEmployeeId === user.id ? 'primary' : 'secondary'} onClick={() => setAssignedEmployeeId(params.assignedEmployeeId === user.id ? '' : user.id)}>Mening mijozlarim</Button>}
        {!isPartner && <Button variant="secondary" onClick={() => setAdvancedFiltersOpen((value) => !value)}>
          Filter
        </Button>}
        {!isPartner && advancedFiltersOpen && (
          <div className="customers-filter-row__advanced">
            <Select value={params.status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Holat</option>
              {CUSTOMER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CUSTOMER_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Select value={params.city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Shahar</option>
              {filterOptions.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
            <Select value={params.installationStatus} onChange={(event) => setInstallationStatus(event.target.value)}>
              <option value="">O'rnatish holati</option>
              {INSTALLATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {INSTALLATION_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Input type="date" value={params.createdTo} onChange={(event) => setCreatedTo(event.target.value)} title="Sanagacha" />
            <Select value={params.sort} onChange={(event) => setSort(event.target.value)}>
              <option value="-createdAt">Yangi qo'shilgan</option>
              <option value="createdAt">Eski qo'shilgan</option>
              <option value="name">Ism (A-Z)</option>
              <option value="-name">Ism (Z-A)</option>
            </Select>
          </div>
        )}
      </div>

      {!isPartner && <TodayWorkPanel />}

      {selectedIds.length > 0 && can('customers.edit') && (
        <div className="bulk-actions-bar">
          <span>{selectedIds.length} ta mijoz tanlandi</span>
          <Button size="sm" variant="secondary" onClick={bulkMoveModal.open}>
            Boshqa voronkaga o'tkazish
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            Bekor qilish
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="danger" title="Mijozlarni yuklab bo'lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && view === 'list' && customers.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="Mijozlar topilmadi" description="Tanlangan filter bo'yicha mijoz yo'q." />
      )}

      {!loading && !error && view === 'list' && customers.length > 0 && (
        <>
          <CustomerTable
            customers={customers}
            stageLabels={stageLabels}
            selectedIds={selectedIds}
            onSelect={isPartner ? undefined : toggleSelected}
            onSelectAll={toggleAllVisible}
            onDeactivate={handleDeactivate}
               onOpen={openCustomer}
               onQuickAction={handleQuickAction}
            partner={isPartner}
          />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {!loading && !error && view === 'kanban' && (
        <KanbanBoard
          columns={visibleStageColumns}
          items={visibleCustomers}
          getColumnId={(customer) => customer.stage}
          renderColumnHeader={(column, columnCustomers) => {
            const totals = filterOptions.stageTotals?.[column.id] || []
            return (
              <div className="kanban__column-summary">
                <div className="kanban__column-summary-top">
                  <InlineStageTitle column={column} canEdit={can('customers.edit')} onSave={handleRenameStage} onDelete={can('customers.edit') && !column.isSystem && !column.isDefault && !column.isProtected ? openDeleteStage : undefined} />
                  <span className="kanban__column-count">{columnCustomers.length}</span>
                </div>
                 {canViewPipelineTotal && <span className="kanban__column-meta">
                    {totals.map((total) => <span className="kanban__column-total" key={total.currency.id || total.currency.code}>{formatCustomerCurrencyAmount(total.amount, total.currency)}</span>)}
                  </span>}
              </div>
            )
          }}
          renderColumnAction={(column) => can('customers.create') ? (
            <button type="button" className="kanban__add-card" onClick={() => openCreateForStage(column.id)}>
              + Mijoz
            </button>
          ) : null}
          renderCard={(customer) => (
            <CustomerKanbanCard
               customer={customer}
              selected={selectedIds.includes(customer.id)}
              onSelect={isPartner ? undefined : toggleSelected}
              onOpen={openCustomer}
               partner={isPartner}
               canViewAmount={canViewAmount}
              stageLabel={stageLabels[customer.stage] || customer.stage}
            />
          )}
          renderColumnGap={(column) => can('customers.edit') ? (
            <button type="button" className="kanban__insert-stage" onClick={() => openCreateStage(column.id)} aria-label="Oraga bosqich qo'shish">
              +
            </button>
          ) : null}
           afterColumns={!isMobile && can('customers.edit') ? (
            <div className="kanban__after-columns">
              <button type="button" className="kanban__create-column" onClick={() => openCreateStage(stageColumns.at(-1)?.id || null)}>
                <PlusIcon width={16} height={16} /> Bosqich
              </button>
            </div>
          ) : null}
          onCardMove={isPartner ? undefined : handleStageMove}
           onColumnMove={!isMobile && can('customers.edit') ? handleReorderStages : undefined}
        />
      )}

      <Modal open={createModal.isOpen} title="Mijoz qo'shish" className="customer-edit-modal" onClose={createModal.close}>
        <CustomerForm
          key={createStageId || 'new-customer'}
          initialValues={{ stage: createStageId || 'NEW', groupIds: params.groupId ? [params.groupId] : [], currentGroupId: params.groupId || '', currentGroupName: activeGroupName }}
          employees={employees}
          stages={stageColumns}
          submitLabel="Qo'shish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={createModal.close}
          canManageGroups={canManageCustomerGroups}
          canViewFinancials={canViewFinancials}
          canViewAmount={canViewAmount}
          canViewDeposit={canViewDeposit}
        />
      </Modal>

      <CreateStageModal
        open={stageModal.isOpen}
        title="Bosqich yaratish"
        initialName=""
        loading={saveStageAction.loading}
        onClose={stageModal.close}
        onSubmit={handleSaveStage}
      />

      <StageDeleteModal
        stageDelete={stageDelete}
        stages={stageColumns}
        loading={deleteStageAction.loading}
        onClose={() => setStageDelete(null)}
        onSubmit={handleDeleteStage}
      />

      <DepositPromptModal
        move={depositMove}
        loading={moveStageAction.loading}
        onClose={() => setDepositMove(null)}
        onSubmit={handleDepositMove}
      />

      <BulkMoveModal
        open={bulkMoveModal.isOpen}
        selectedCount={selectedIds.length}
        stages={stageColumns}
        activeGroupId={params.groupId}
        loading={bulkMoveAction.loading}
        onClose={bulkMoveModal.close}
        onSubmit={handleBulkMove}
      />

      <FollowUpPromptModal move={followUpMove} loading={moveStageAction.loading} onClose={() => setFollowUpMove(null)} onSubmit={handleFollowUpMove} />
      <InstallationPromptModal move={installationMove} employees={employees} loading={moveStageAction.loading} onClose={() => setInstallationMove(null)} onSubmit={handleInstallationMove} />
      <QuickActionModal action={quickAction} customer={quickCustomer} onClose={closeQuickAction} onChanged={handleCustomerChanged} />
      <ReminderModal open={Boolean(reminderType)} type={reminderType || 'CALL'} customer={quickCustomer} onClose={closeQuickAction} onCreated={handleCustomerChanged} />

      {activeCustomerId && (
        <CustomerEditModal
          customerId={activeCustomerId}
          employees={employees}
          stages={stageColumns}
          readOnly={isPartner}
          loadingStages={saveStageAction.loading}
          onClose={closeCustomer}
          onChanged={handleCustomerChanged}
          canViewFinancials={canViewFinancials}
          canViewAmount={canViewAmount}
          canViewDeposit={canViewDeposit}
        />
      )}
    </div>
  )
}
