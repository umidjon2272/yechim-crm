import { useAsync } from '../../hooks/useAsync'
import { useAction } from '../../hooks/useAction'
import { activitiesService } from '../../services/activities.service'
import { usePermissions } from '../roles/usePermissions'
import { Card } from '../../components/Card/Card'
import { Button } from '../../components/Button/Button'
import { Modal } from '../../components/Modal/Modal'
import { Spinner } from '../../components/Spinner/Spinner'
import { Timeline } from '../../components/Timeline/Timeline'
import { useDisclosure } from '../../hooks/useDisclosure'
import { useToast } from '../../store/ToastContext'
import { ActivityForm } from './components/ActivityForm'

/**
 * Drop into any Customer/Business/Lead/Deal/Installation detail page:
 * `fetcher` is that entity's `getActivities(id)` service call, `context`
 * fixes the entity link (e.g. { dealId: id }) for newly logged activities.
 */
export function ActivitiesSection({ title = 'Faoliyat tarixi', fetcher, deps, context }) {
  const { can } = usePermissions()
  const { data, loading, refetch } = useAsync(fetcher, deps)
  const { isOpen, open, close } = useDisclosure()
  const createAction = useAction(activitiesService.create)
  const toast = useToast()

  const items = data?.items ?? data ?? []

  const handleSubmit = async (payload) => {
    try {
      await createAction.run(payload)
      toast.success('Faoliyat qo‘shildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Faoliyat qo‘shishda xatolik yuz berdi')
    }
  }

  return (
    <Card
      title={title}
      actions={
        can('activities.create') && (
          <Button size="sm" onClick={open}>
            Faoliyat qo‘shish
          </Button>
        )
      }
    >
      {loading ? (
        <div className="page-loading">
          <Spinner />
        </div>
      ) : (
        <Timeline items={items} />
      )}

      <Modal open={isOpen} title="Faoliyat qo‘shish" onClose={close}>
        <ActivityForm context={context} loading={createAction.loading} onSubmit={handleSubmit} onCancel={close} />
      </Modal>
    </Card>
  )
}
