import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomer, useCustomers } from '../customers.hooks'
import { customersService, customerGroupsService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { CustomerTable } from '../components/CustomerTable'
import { CustomerKanbanCard, getCustomerAmount } from '../components/CustomerKanbanCard'
import { CustomerForm } from '../components/CustomerForm'
import { CreateStageModal } from '../components/CreateStageModal'
import { CustomerGroupsBar } from '../components/CustomerGroupsBar'
import { formatCustomerAmount } from '../customerAmount'
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABELS, CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS } from '../customers.constants'
import { INSTALLATION_STATUSES, INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Modal } from '../../../components/Modal/Modal'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { KanbanBoard } from '../../../components/Kanban/KanbanBoard'
import { PermissionGate } from '../../roles/PermissionGate'
import { useToast } from '../../../store/ToastContext'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { InboxIcon, MoreIcon, PlusIcon, SearchIcon } from '../../../components/icons/Icons'
import { classNames } from '../../../utils/classNames'
import './CustomersListPage.scss'

function fallbackStages() {
  return CUSTOMER_STAGES.map((stage) => ({ id: stage, label: CUSTOMER_STAGE_LABELS[stage] }))
}

function CustomerEditModal({ customerId, employees, stages, loadingStages, onClose, onChanged }) {
  const toast = useToast()
  const { data: customer, loading, error, refetch } = useCustomer(customerId)
  const updateAction = useAction((values) => customersService.update(customerId, values))

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
      {!loading && !error && customer && (
        <CustomerForm
          initialValues={customer}
          employees={employees}
          stages={stages}
          submitLabel="Saqlash"
          loading={updateAction.loading || loadingStages}
          onSubmit={handleUpdate}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}

function StageDeleteModal({ stage, stages, count, loading, onClose, onSubmit }) {
  const [replacementStageId, setReplacementStageId] = useState('')
  const options = stages.filter((item) => item.id !== stage?.id)

  useEffect(() => {
    if (stage) setReplacementStageId(options[0]?.id || '')
  }, [stage?.id])

  if (!stage) return null

  return (
    <Modal
      open={!!stage}
      title="Bosqichni o'chirish"
      danger
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Bekor qilish
          </Button>
          <Button variant="danger" loading={loading} disabled={count > 0 && !replacementStageId} onClick={() => onSubmit(replacementStageId)}>
            {count > 0 ? "O'tkazish va o'chirish" : "O'chirish"}
          </Button>
        </>
      }
    >
      {count > 0 ? (
        <div className="stack">
          <p className="text-muted">Bu bosqichda {count} ta mijoz mavjud. Ularni qaysi bosqichga o'tkazamiz?</p>
          <Select value={replacementStageId} onChange={(event) => setReplacementStageId(event.target.value)}>
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <p className="text-muted">"{stage.label}" bosqichi o'chirilsinmi?</p>
      )}
    </Modal>
  )
}

function PipelineManagerModal({ open, stages, onClose, onRename, onMove, onDelete, onCreateAfter }) {
  return (
    <Modal open={open} title="Savdo jarayonlarini boshqarish" className="pipeline-manager-modal" onClose={onClose}>
      <div className="pipeline-manager">
        <div className="pipeline-manager__title">Asosiy savdo</div>
        <div className="pipeline-manager__stages">
          {stages.map((stage, index) => (
            <div key={stage.id} className="pipeline-manager__stage">
              <span>{stage.label}</span>
              <div className="pipeline-manager__actions">
                <button type="button" onClick={() => onMove(stage, 'left')} disabled={index === 0}>
                  Chapga
                </button>
                <button type="button" onClick={() => onMove(stage, 'right')} disabled={index === stages.length - 1}>
                  O'ngga
                </button>
                <button type="button" onClick={() => onRename(stage)}>
                  Rename
                </button>
                <button type="button" className="pipeline-manager__danger" onClick={() => onDelete(stage)}>
                  O'chirish
                </button>
              </div>
              {index < stages.length - 1 && (
                <button type="button" className="pipeline-manager__insert" onClick={() => onCreateAfter(stage.id)} aria-label="Oraga bosqich qo'shish">
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
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
      title="Boshqa savdo jarayoniga o'tkazish"
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
    setStage,
    setAssignedEmployeeId,
    setCity,
    setProgram,
    setGroupId,
    setInstallationStatus,
    setCreatedFrom,
    setCreatedTo,
    setSort,
    setPage,
    loading,
    error,
    refetch,
  } = useCustomers()
  const createModal = useDisclosure()
  const stageModal = useDisclosure()
  const pipelineModal = useDisclosure()
  const bulkMoveModal = useDisclosure()
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [createStageId, setCreateStageId] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filterOptions, setFilterOptions] = useState({ cities: [], programs: [], stageCounts: {}, stages: fallbackStages() })
  const [stageDraft, setStageDraft] = useState({ mode: 'create', stage: null, afterStageId: null })
  const [stageDelete, setStageDelete] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [optimisticStages, setOptimisticStages] = useState({})
  const toast = useToast()

  const createAction = useAction(async (customerPayload, businessPayload) => {
    const customer = await customersService.create(customerPayload)
    if (businessPayload) await businessesService.create({ ...businessPayload, customerId: customer.id })
    return customer
  })
  const deactivateAction = useAction((customer) => customersService.deactivate(customer.id))
  const moveStageAction = useAction(({ id, stage }) => customersService.setStage(id, stage))
  const saveStageAction = useAction((payload) =>
    payload.id ? customersService.updateStage(payload.id, payload.values) : customersService.createStage(payload.values)
  )
  const deleteStageAction = useAction(({ id, replacementStageId }) => customersService.deleteStage(id, { replacementStageId }))
  const bulkMoveAction = useAction((payload) => customersService.bulkMove(payload))

  const loadFilterOptions = () => {
    Promise.all([
      customersService.getFilterOptions(),
      customersService.listStages().catch(() => ({ items: fallbackStages() })),
    ])
      .then(([res, stagesRes]) =>
        setFilterOptions({
          cities: res?.cities ?? [],
          programs: res?.programs ?? [],
          stageCounts: res?.stageCounts ?? {},
          stages: stagesRes?.items?.length ? stagesRes.items : fallbackStages(),
        })
      )
      .catch(() => setFilterOptions({ cities: [], programs: [], stageCounts: {}, stages: fallbackStages() }))
  }

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((employee) => employee.status === 'active')))
      .catch(() => setEmployees([]))
    loadFilterOptions()
  }, [])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => customers.some((customer) => customer.id === id)))
  }, [customers])

  const stageColumns = useMemo(() => filterOptions.stages.map((stage) => ({ id: stage.id, label: stage.label })), [filterOptions.stages])
  const stageLabels = useMemo(
    () => filterOptions.stages.reduce((acc, stage) => ({ ...acc, [stage.id]: stage.label }), { ...CUSTOMER_STAGE_LABELS }),
    [filterOptions.stages]
  )
  const displayedCustomers = useMemo(
    () => customers.map((customer) => (optimisticStages[customer.id] ? { ...customer, stage: optimisticStages[customer.id] } : customer)),
    [customers, optimisticStages]
  )
  const activeCustomerId = selectedCustomerId || routeCustomerId

  const openCustomer = (customerId) => setSelectedCustomerId(customerId)
  const closeCustomer = () => {
    setSelectedCustomerId(null)
    if (routeCustomerId) navigate('/admin/crm/customers')
  }

  const handleCreate = async (customerPayload, businessPayload) => {
    try {
      await createAction.run(customerPayload, businessPayload)
      toast.success("Mijoz qo'shildi")
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
    setOptimisticStages((current) => ({ ...current, [customer.id]: toStage }))
    try {
      await moveStageAction.run({ id: customer.id, stage: toStage })
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

  const openCreateStage = (afterStageId = null) => {
    setStageDraft({ mode: 'create', stage: null, afterStageId })
    stageModal.open()
  }

  const openRenameStage = (stage) => {
    setStageDraft({ mode: 'rename', stage, afterStageId: null })
    stageModal.open()
  }

  const handleSaveStage = async (name) => {
    try {
      if (stageDraft.mode === 'rename') {
        await saveStageAction.run({ id: stageDraft.stage.id, values: { name } })
        toast.success("Bosqich nomi o'zgartirildi")
      } else {
        await saveStageAction.run({ values: { name, afterStageId: stageDraft.afterStageId } })
        toast.success('Bosqich yaratildi')
      }
      stageModal.close()
      loadFilterOptions()
      await refetch()
    } catch (err) {
      toast.error(err.message || 'Bosqichni saqlashda xatolik yuz berdi')
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
    const count = displayedCustomers.filter((customer) => customer.stage === stage.id).length
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
              Savdo jarayoni
            </button>
            <button type="button" className={classNames('view-toggle__btn', view === 'list' && 'view-toggle__btn--active')} onClick={() => setView('list')}>
              Ro'yxat
            </button>
          </div>
          <Button variant="secondary" onClick={pipelineModal.open}>
            Savdo jarayonlarini boshqarish
          </Button>
          <PermissionGate permission="customers.create">
            <Button onClick={() => {
              setCreateStageId(null)
              createModal.open()
            }}>
              <PlusIcon width={16} height={16} /> Mijoz qo'shish
            </Button>
          </PermissionGate>
        </div>
      </div>

      <CustomerGroupsBar activeGroupId={params.groupId} onSelectGroup={setGroupId} />

      <div className="filters-row customers-filter-row">
        <div className="input-group filters-row__search customers-filter-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Qidirish" value={params.search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={params.assignedEmployeeId} onChange={(event) => setAssignedEmployeeId(event.target.value)}>
          <option value="">Xodim</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
        <Select value={params.program} onChange={(event) => setProgram(event.target.value)}>
          <option value="">Dastur</option>
          {filterOptions.programs.map((program) => (
            <option key={program} value={program}>
              {program}
            </option>
          ))}
        </Select>
        <Input type="date" value={params.createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} title="Sana" />
        <Button variant="secondary" onClick={() => setAdvancedFiltersOpen((value) => !value)}>
          Filter
        </Button>
        {advancedFiltersOpen && (
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

      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedIds.length} ta mijoz tanlandi</span>
          <Button size="sm" variant="secondary" onClick={bulkMoveModal.open}>
            Boshqa savdo jarayoniga o'tkazish
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
            onSelect={toggleSelected}
            onSelectAll={toggleAllVisible}
            onDeactivate={handleDeactivate}
            onOpen={openCustomer}
          />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {!loading && !error && view === 'kanban' && (
        <KanbanBoard
          columns={stageColumns}
          items={displayedCustomers}
          getColumnId={(customer) => customer.stage}
          renderColumnHeader={(column, columnCustomers, index) => {
            const totalAmount = columnCustomers.reduce((sum, customer) => sum + getCustomerAmount(customer), 0)
            return (
              <div className="kanban__column-summary">
                <div className="kanban__column-summary-top">
                  <span className="kanban__column-title">{column.label}</span>
                  <span className="kanban__column-count">{columnCustomers.length}</span>
                  <Dropdown
                    align={index > stageColumns.length - 3 ? 'left' : 'right'}
                    trigger={(toggle) => (
                      <button type="button" className="stage-menu-btn" onClick={toggle} aria-label="Bosqich amallari">
                        <MoreIcon width={16} height={16} />
                      </button>
                    )}
                  >
                    <DropdownItem onClick={() => openRenameStage(column)}>Nomini o'zgartirish</DropdownItem>
                    <DropdownItem onClick={() => handleMoveStage(column, 'left')}>Chapga ko'chirish</DropdownItem>
                    <DropdownItem onClick={() => handleMoveStage(column, 'right')}>O'ngga ko'chirish</DropdownItem>
                    <DropdownItem danger onClick={() => openDeleteStage(column)}>
                      O'chirish
                    </DropdownItem>
                  </Dropdown>
                </div>
                <span className="kanban__column-meta">
                  <span className="kanban__column-total">{formatCustomerAmount(totalAmount)}</span>
                </span>
              </div>
            )
          }}
          renderColumnAction={(column) => (
            <button type="button" className="kanban__add-card" onClick={() => openCreateForStage(column.id)}>
              + Mijoz
            </button>
          )}
          renderCard={(customer) => (
            <CustomerKanbanCard
              customer={customer}
              selected={selectedIds.includes(customer.id)}
              onSelect={toggleSelected}
              onOpen={openCustomer}
            />
          )}
          renderColumnGap={(column) => (
            <button type="button" className="kanban__insert-stage" onClick={() => openCreateStage(column.id)} aria-label="Oraga bosqich qo'shish">
              +
            </button>
          )}
          afterColumns={
            <div className="kanban__after-columns">
              <button type="button" className="kanban__create-column" onClick={() => openCreateStage(stageColumns.at(-1)?.id || null)}>
                <PlusIcon width={16} height={16} /> Bosqich
              </button>
            </div>
          }
          onCardMove={handleStageMove}
        />
      )}

      <Modal open={createModal.isOpen} title="Mijoz qo'shish" className="customer-edit-modal" onClose={createModal.close}>
        <CustomerForm
          initialValues={{ stage: createStageId || 'NEW' }}
          employees={employees}
          stages={stageColumns}
          submitLabel="Qo'shish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={createModal.close}
        />
      </Modal>

      <CreateStageModal
        open={stageModal.isOpen}
        title={stageDraft.mode === 'rename' ? "Bosqich nomini o'zgartirish" : 'Bosqich yaratish'}
        initialName={stageDraft.mode === 'rename' ? stageDraft.stage?.label || '' : ''}
        loading={saveStageAction.loading}
        onClose={stageModal.close}
        onSubmit={handleSaveStage}
      />

      <StageDeleteModal
        stage={stageDelete?.stage}
        count={stageDelete?.count || 0}
        stages={stageColumns}
        loading={deleteStageAction.loading}
        onClose={() => setStageDelete(null)}
        onSubmit={handleDeleteStage}
      />

      <PipelineManagerModal
        open={pipelineModal.isOpen}
        stages={stageColumns}
        onClose={pipelineModal.close}
        onRename={openRenameStage}
        onMove={handleMoveStage}
        onDelete={openDeleteStage}
        onCreateAfter={openCreateStage}
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

      {activeCustomerId && (
        <CustomerEditModal
          customerId={activeCustomerId}
          employees={employees}
          stages={stageColumns}
          loadingStages={saveStageAction.loading}
          onClose={closeCustomer}
          onChanged={handleCustomerChanged}
        />
      )}
    </div>
  )
}
