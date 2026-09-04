import { useEffect, useState } from 'react'
import { useDeals } from '../deals.hooks'
import { dealsService } from '../../../services/deals.service'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { DealTable } from '../components/DealTable'
import { DealCard } from '../components/DealCard'
import { DealForm } from '../components/DealForm'
import { DEAL_STAGES, DEAL_STAGE_LABELS, DEAL_KANBAN_COLUMNS } from '../deals.constants'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Modal } from '../../../components/Modal/Modal'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { KanbanBoard } from '../../../components/Kanban/KanbanBoard'
import { PermissionGate } from '../../roles/PermissionGate'
import { useToast } from '../../../store/ToastContext'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { classNames } from '../../../utils/classNames'
import { InboxIcon, PlusIcon, SearchIcon } from '../../../components/icons/Icons'

export function DealsListPage() {
  const { view, setView, deals, total, params, setSearch, setStage, setSalesEmployeeId, setPage, loading, error, refetch } = useDeals()
  const { isOpen, open, close } = useDisclosure()
  const [customers, setCustomers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [employees, setEmployees] = useState([])
  const toast = useToast()

  const createAction = useAction(dealsService.create)
  const stageAction = useAction(({ id, stage }) => dealsService.updateStage(id, stage))

  useEffect(() => {
    customersService.list({ pageSize: 100 }).then((res) => setCustomers(res?.items ?? [])).catch(() => setCustomers([]))
    businessesService.list({ pageSize: 100 }).then((res) => setBusinesses(res?.items ?? [])).catch(() => setBusinesses([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Savdo qo‘shildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Savdo qo‘shishda xatolik yuz berdi')
    }
  }

  const handleCardMove = async (deal, fromStage, toStage) => {
    try {
      await stageAction.run({ id: deal.id, stage: toStage })
      toast.success(`"${deal.name}" ${DEAL_STAGE_LABELS[toStage]} bosqichiga ko‘chirildi`)
      refetch()
    } catch (err) {
      toast.error(err.message || 'Bosqichni yangilashda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Savdolar</h2>
          <p className="page-header__subtitle">Sotuv bitimlari</p>
        </div>
        <div className="page-header__actions">
          <div className="view-toggle">
            <button type="button" className={classNames('view-toggle__btn', view === 'list' && 'view-toggle__btn--active')} onClick={() => setView('list')}>
              Ro‘yxat
            </button>
            <button type="button" className={classNames('view-toggle__btn', view === 'kanban' && 'view-toggle__btn--active')} onClick={() => setView('kanban')}>
              Kanban
            </button>
          </div>
          <PermissionGate permission="deals.create">
            <Button onClick={open}>
              <PlusIcon width={16} height={16} /> Yangi savdo
            </Button>
          </PermissionGate>
        </div>
      </div>

      {view === 'list' && (
        <div className="filters-row">
          <div className="input-group filters-row__search">
            <span className="input-group__icon">
              <SearchIcon width={16} height={16} />
            </span>
            <Input placeholder="Savdo nomi bo‘yicha qidirish" value={params.search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={params.stage} onChange={(e) => setStage(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Barcha bosqichlar</option>
            {DEAL_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {DEAL_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
          <Select value={params.salesEmployeeId} onChange={(e) => setSalesEmployeeId(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Barcha xodimlar</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && (
        <Alert variant="danger" title="Savdolarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && deals.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="Savdolar topilmadi" description="Hozircha savdo yaratilmagan." />
      )}

      {!loading && !error && deals.length > 0 && view === 'list' && (
        <>
          <DealTable deals={deals} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {!loading && !error && deals.length > 0 && view === 'kanban' && (
        <KanbanBoard
          columns={DEAL_KANBAN_COLUMNS}
          items={deals}
          getColumnId={(deal) => deal.stage}
          renderCard={(deal) => <DealCard deal={deal} />}
          onCardMove={handleCardMove}
        />
      )}

      <Modal open={isOpen} title="Yangi savdo yaratish" onClose={close}>
        <DealForm
          customers={customers}
          businesses={businesses}
          employees={employees}
          submitLabel="Yaratish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
