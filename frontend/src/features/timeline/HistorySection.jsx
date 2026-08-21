import { timelineService } from '../../services/timeline.service'
import { useAsync } from '../../hooks/useAsync'
import { Card } from '../../components/Card/Card'
import { Spinner } from '../../components/Spinner/Spinner'
import { Timeline } from '../../components/Timeline/Timeline'
import { usePermissions } from '../roles/usePermissions'

/**
 * Read-only merged history for a Customer or Deal — everything that ever
 * happened to it (lead created, stage changes, quotation/payment/
 * installation events, logged activities) in one feed, via GET /timeline.
 * This is separate from ActivitiesSection, which is for *logging* new
 * CALL/MEETING/DEMO/NOTE entries — History just displays.
 */
export function HistorySection({ entityType, entityId, title = 'Tarix' }) {
  const { can } = usePermissions()
  const canView = can('history.view')
  const { data, loading, error } = useAsync(() => canView ? timelineService.get(entityType, entityId) : Promise.resolve({ items: [] }), [entityType, entityId, canView])
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []

  if (!canView) return null

  return (
    <Card title={title} className="history-section">
      {loading ? (
        <div className="page-loading">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-muted text-xs">Tarixni yuklab bo‘lmadi: {error.message}</p>
      ) : (
        <Timeline items={items} />
      )}
    </Card>
  )
}
