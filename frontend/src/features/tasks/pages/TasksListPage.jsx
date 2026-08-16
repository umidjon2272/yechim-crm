import { useEffect, useState } from 'react'
import { useTasks } from '../tasks.hooks'
import { tasksService } from '../../../services/tasks.service'
import { employeesService } from '../../../services/employees.service'
import { TaskTable } from '../components/TaskTable'
import { TaskForm } from '../components/TaskForm'
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from '../tasks.constants'
import { Button } from '../../../components/Button/Button'
import { Select } from '../../../components/Select/Select'
import { Modal } from '../../../components/Modal/Modal'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAuth } from '../../auth/useAuth'
import { usePermissions } from '../../roles/usePermissions'
import { useToast } from '../../../store/ToastContext'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { classNames } from '../../../utils/classNames'
import { InboxIcon, PlusIcon } from '../../../components/icons/Icons'

export function TasksListPage() {
  const { tasks, total, params, canViewAll, setStatus, setPriority, setAssignedToMe, setPage, loading, error, refetch } = useTasks()
  const { user } = useAuth()
  const { can } = usePermissions()
  const { isOpen, open, close } = useDisclosure()
  const [employees, setEmployees] = useState([])
  const toast = useToast()

  const createAction = useAction(tasksService.create)
  const updateStatusAction = useAction(({ id, status }) => tasksService.update(id, { status }))
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Vazifa qo‘shildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Vazifa qo‘shishda xatolik yuz berdi')
    }
  }

  const canEditTaskStatus = (task) => can('tasks.edit') || task.assignedEmployee?.id === user?.id || task.assignedEmployeeId === user?.id
  const getStatusOptions = (task) => (can('tasks.edit') ? TASK_STATUSES : ['TODO', 'IN_PROGRESS', 'COMPLETED'].filter((status) => status === task.status || status !== 'TODO'))

  const handleStatusChange = async (task, status) => {
    if (task.status === status) return
    setStatusLoadingId(task.id)
    try {
      await updateStatusAction.run({ id: task.id, status })
      toast.success('Vazifa holati yangilandi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Vazifa holatini yangilashda xatolik yuz berdi')
    } finally {
      setStatusLoadingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Vazifalar</h2>
          <p className="page-header__subtitle">Vazifalar</p>
        </div>
        <PermissionGate permission="tasks.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi vazifa
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        {canViewAll && (
          <div className="view-toggle">
            <button
              type="button"
              className={classNames('view-toggle__btn', params.assignedToMe && 'view-toggle__btn--active')}
              onClick={() => setAssignedToMe(true)}
            >
              Mening vazifalarim
            </button>
            <button
              type="button"
              className={classNames('view-toggle__btn', !params.assignedToMe && 'view-toggle__btn--active')}
              onClick={() => setAssignedToMe(false)}
            >
              Barcha vazifalar
            </button>
          </div>
        )}
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={params.priority} onChange={(e) => setPriority(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha muhimliklar</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TASK_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="Vazifalarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="Vazifalar topilmadi" description="Hozircha vazifa yaratilmagan." />
      )}

      {!loading && !error && tasks.length > 0 && (
        <>
          <TaskTable
            tasks={tasks}
            onStatusChange={handleStatusChange}
            canEditStatus={canEditTaskStatus}
            getStatusOptions={getStatusOptions}
            statusLoadingId={statusLoadingId}
          />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi vazifa qo‘shish" onClose={close}>
        <TaskForm employees={employees} submitLabel="Qo‘shish" loading={createAction.loading} onSubmit={handleCreate} onCancel={close} />
      </Modal>
    </div>
  )
}
