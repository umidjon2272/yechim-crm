import { activitiesService } from '../../../services/activities.service'
import { ActivityForm } from './ActivityForm'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../store/ToastContext'
import { PhoneIcon } from '../../../components/icons/Icons'

// "Qo'ng'iroq" quick action — a call log is just an Activity with type CALL
// (already ActivityForm's default selection), linked back to the entity via
// `context`. Lands in Faoliyatlar + the customer's Timeline automatically.
export function LogCallButton({ context, onCreated }) {
  const { isOpen, open, close } = useDisclosure()
  const createAction = useAction(activitiesService.create)
  const toast = useToast()

  const handleSubmit = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Qo‘ng‘iroq qayd etildi')
      close()
      onCreated?.()
    } catch (err) {
      toast.error(err.message || 'Qo‘ng‘iroqni qayd etishda xatolik yuz berdi')
    }
  }

  return (
    <PermissionGate permission="activities.create">
      <Button variant="secondary" onClick={open}>
        <PhoneIcon width={16} height={16} /> Qo‘ng‘iroq
      </Button>
      <Modal open={isOpen} title="Qo‘ng‘iroqni qayd etish" onClose={close}>
        <ActivityForm context={context} loading={createAction.loading} onSubmit={handleSubmit} onCancel={close} />
      </Modal>
    </PermissionGate>
  )
}
