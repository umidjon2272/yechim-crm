import { useActivities } from '../activities.hooks'
import { activitiesService } from '../../../services/activities.service'
import { ActivityForm } from '../components/ActivityForm'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '../activities.constants'
import { Button } from '../../../components/Button/Button'
import { Select } from '../../../components/Select/Select'
import { Modal } from '../../../components/Modal/Modal'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Timeline } from '../../../components/Timeline/Timeline'
import { Pagination } from '../../../components/Pagination/Pagination'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../store/ToastContext'
import { PlusIcon } from '../../../components/icons/Icons'

export function ActivitiesListPage() {
  const { activities, total, params, setType, setPage, loading, error, refetch } = useActivities()
  const { isOpen, open, close } = useDisclosure()
  const createAction = useAction(activitiesService.create)
  const toast = useToast()

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
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Faoliyatlar</h2>
          <p className="page-header__subtitle">Qo‘ng‘iroq, uchrashuv, demo va izohlar tarixi</p>
        </div>
        <PermissionGate permission="activities.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Faoliyat qo‘shish
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <Select value={params.type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Barcha turlar</option>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="Faoliyatlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && (
        <>
          <Timeline items={activities} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Faoliyat qo‘shish" onClose={close}>
        <ActivityForm loading={createAction.loading} onSubmit={handleSubmit} onCancel={close} />
      </Modal>
    </div>
  )
}
