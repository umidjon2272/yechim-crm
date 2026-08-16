import { useEffect, useState } from 'react'
import { useEmployees } from '../employees.hooks'
import { employeesService } from '../../../services/employees.service'
import { teamsService } from '../../../services/teams.service'
import { EmployeeTable } from '../components/EmployeeTable'
import { EmployeeForm } from '../components/EmployeeForm'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { Modal } from '../../../components/Modal/Modal'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { PermissionGate } from '../../roles/PermissionGate'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { InboxIcon, PlusIcon, SearchIcon } from '../../../components/icons/Icons'

export function EmployeesListPage() {
  const { employees, total, params, setSearch, setPage, loading, error, refetch } = useEmployees()
  const { isOpen: isCreateOpen, open: openCreate, close: closeCreate } = useDisclosure()
  const [teams, setTeams] = useState([])
  const confirm = useConfirm()
  const toast = useToast()

  const createAction = useAction(employeesService.create)
  const toggleStatusAction = useAction((employee) =>
    employee.status === 'active' ? employeesService.deactivate(employee.id) : employeesService.activate(employee.id)
  )

  useEffect(() => {
    teamsService
      .list()
      .then((res) => setTeams(res?.items ?? []))
      .catch(() => setTeams([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Xodim muvaffaqiyatli qo‘shildi')
      closeCreate()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Xodim qo‘shishda xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async (employee) => {
    const activating = employee.status !== 'active'
    const ok = await confirm({
      title: activating ? 'Xodimni faollashtirish' : 'Xodimni faolsizlantirish',
      description: `${employee.name} ${activating ? 'faollashtirilsinmi' : 'faolsizlantirilsinmi'}?`,
      confirmLabel: activating ? 'Faollashtirish' : 'Faolsizlantirish',
      danger: !activating,
    })
    if (!ok) return

    try {
      await toggleStatusAction.run(employee)
      toast.success('Holat yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Holatni yangilashda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Xodimlar</h2>
          <p className="page-header__subtitle">Kompaniya xodimlarini boshqarish</p>
        </div>
        <div className="page-header__actions">
          <PermissionGate permission="employees.create">
            <Button onClick={openCreate}>
              <PlusIcon width={16} height={16} /> Yangi xodim
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="filters-row">
        <div className="input-group filters-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Ism yoki email bo‘yicha qidirish" value={params.search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Xodimlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <EmptyState
          icon={<InboxIcon width={22} height={22} />}
          title="Xodimlar topilmadi"
          description="Hozircha xodimlar ro‘yxati bo‘sh yoki qidiruv natija bermadi."
        />
      )}

      {!loading && !error && employees.length > 0 && (
        <>
          <EmployeeTable employees={employees} onToggleStatus={handleToggleStatus} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isCreateOpen} title="Yangi xodim qo‘shish" onClose={closeCreate}>
        <EmployeeForm teams={teams} submitLabel="Qo‘shish" loading={createAction.loading} onSubmit={handleCreate} onCancel={closeCreate} />
      </Modal>
    </div>
  )
}
