import { useState } from 'react'
import { tasksService } from '../../../services/tasks.service'
import { employeesService } from '../../../services/employees.service'
import { TaskForm } from './TaskForm'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../store/ToastContext'

/**
 * Follow-up isn't a separate backend concept — it's a Task with a due date,
 * linked back to the entity it concerns. This wraps the existing TaskForm so
 * "schedule a follow-up" is really just "create a task," reusing the same
 * tasksService.create call every other Task creation path uses.
 */
export function ScheduleFollowUpButton({ entityName, context, label = 'Qayta bog‘lanishni rejalashtirish', onCreated }) {
  const { isOpen, open, close } = useDisclosure()
  const [employees, setEmployees] = useState([])
  const createAction = useAction(tasksService.create)
  const toast = useToast()

  const handleOpen = () => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
    open()
  }

  const handleSubmit = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Qayta bog‘lanish vazifasi yaratildi')
      close()
      onCreated?.()
    } catch (err) {
      toast.error(err.message || 'Qayta bog‘lanish yaratishda xatolik yuz berdi')
    }
  }

  return (
    <PermissionGate permission="tasks.create">
      <Button variant="secondary" onClick={handleOpen}>
        {label}
      </Button>
      <Modal open={isOpen} title="Qayta bog‘lanishni rejalashtirish" onClose={close}>
        <TaskForm
          initialValues={{ title: entityName ? `${entityName} bilan qayta bog‘lanish` : '', priority: 'MEDIUM' }}
          context={context}
          employees={employees}
          submitLabel="Yaratish"
          loading={createAction.loading}
          onSubmit={handleSubmit}
          onCancel={close}
        />
      </Modal>
    </PermissionGate>
  )
}
