import { useState } from 'react'
import { customersService } from '../../../services/customers.service'
import { installationsService } from '../../../services/installations.service'
import { tasksService } from '../../../services/tasks.service'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../store/ToastContext'
import { Card } from '../../../components/Card/Card'
import { Badge } from '../../../components/Badge/Badge'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { InstallationForm } from '../../installations/components/InstallationForm'
import { TaskForm } from '../../tasks/components/TaskForm'
import { INSTALLATION_STATUS_LABELS, INSTALLATION_STATUS_BADGE_VARIANTS } from '../../installations/installations.constants'
import { formatDate } from '../../../utils/formatDate'
import { InboxIcon, PlusIcon } from '../../../components/icons/Icons'
import './InstallationsPanel.scss'

// O'rnatish qatoridagi "+ Vazifa" — mijoz + o'rnatish (va u orqali dastur/
// savdo) bilan avtomatik bog'langan vazifa, standalone Vazifalar bo'limida
// ham ko'rinadi (task customerId/installationId orqali).
export function InstallationsPanel({ customerId, deals = [], employees = [], onChanged }) {
  const { data, loading, refetch } = useAsync(() => customersService.getInstallations(customerId), [customerId])
  const installations = data?.items ?? []

  const [taskInstallation, setTaskInstallation] = useState(null)
  const installationModal = useDisclosure()
  const taskModal = useDisclosure()
  const toast = useToast()

  const createInstallationAction = useAction(installationsService.create)
  const createTaskAction = useAction(tasksService.create)

  const openCreateTask = (installation) => {
    setTaskInstallation(installation)
    taskModal.open()
  }

  const handleCreateInstallation = async (values) => {
    try {
      await createInstallationAction.run({ ...values, customerId })
      toast.success('O‘rnatish rejalashtirildi')
      installationModal.close()
      refetch()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'O‘rnatishni saqlashda xatolik yuz berdi')
    }
  }

  const handleCreateTask = async (values) => {
    try {
      await createTaskAction.run(values)
      toast.success('Vazifa yaratildi')
      taskModal.close()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Vazifa yaratishda xatolik yuz berdi')
    }
  }

  return (
    <>
      <Card
        title="O‘rnatishlar"
        actions={
          deals.length > 0 && (
            <Button size="sm" onClick={installationModal.open}>
              <PlusIcon width={14} height={14} /> O‘rnatish
            </Button>
          )
        }
      >
        {!loading && installations.length === 0 && (
          <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Hali o‘rnatish rejalashtirilmagan" />
        )}
        {deals.length === 0 && <p className="text-muted text-xs">O‘rnatish yaratish uchun avval bu mijozga savdo yaratilishi kerak.</p>}
        {installations.length > 0 && (
          <div className="stack">
            {installations.map((installation) => (
              <div key={installation.id} className="installation-row">
                <div className="installation-row__main">
                  <span className="installation-row__address">{installation.address || installation.deal?.name}</span>
                  <Badge variant={INSTALLATION_STATUS_BADGE_VARIANTS[installation.status] || 'gray'}>
                    {INSTALLATION_STATUS_LABELS[installation.status] || installation.status}
                  </Badge>
                </div>
                <div className="installation-row__meta text-muted text-xs">
                  {installation.scheduledDate ? `Reja: ${formatDate(installation.scheduledDate)}` : ''}
                  {installation.assignedEmployee?.name ? ` · Mas'ul: ${installation.assignedEmployee.name}` : ''}
                </div>
                <Button size="sm" variant="ghost" onClick={() => openCreateTask(installation)}>
                  + Vazifa
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={installationModal.isOpen} title="O‘rnatish rejalashtirish" onClose={installationModal.close}>
        <InstallationForm
          deals={deals}
          employees={employees}
          submitLabel="Rejalashtirish"
          loading={createInstallationAction.loading}
          onSubmit={handleCreateInstallation}
          onCancel={installationModal.close}
        />
      </Modal>

      <Modal open={taskModal.isOpen} title="Vazifa yaratish" onClose={taskModal.close}>
        <TaskForm
          initialValues={{
            title: taskInstallation ? `O‘rnatish: ${taskInstallation.address || taskInstallation.deal?.name || ''}` : '',
            priority: 'MEDIUM',
            dueDate: taskInstallation?.scheduledDate || '',
            assignedEmployeeId: taskInstallation?.assignedEmployee?.id || '',
          }}
          context={{
            customerId,
            installationId: taskInstallation?.id,
            dealId: taskInstallation?.dealId,
          }}
          employees={employees}
          submitLabel="Yaratish"
          loading={createTaskAction.loading}
          onSubmit={handleCreateTask}
          onCancel={taskModal.close}
        />
      </Modal>
    </>
  )
}
