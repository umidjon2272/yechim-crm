import { timelineService } from '../../services/timeline.service'
import { useAsync } from '../../hooks/useAsync'
import { Card } from '../../components/Card/Card'
import { Spinner } from '../../components/Spinner/Spinner'
import { Timeline } from '../../components/Timeline/Timeline'

/**
 * Read-only merged history for a Customer or Deal — everything that ever
 * happened to it (lead created, stage changes, quotation/payment/
 * installation events, logged activities) in one feed, via GET /timeline.
 * This is separate from ActivitiesSection, which is for *logging* new
 * CALL/MEETING/DEMO/NOTE entries — History just displays.
 */
export function HistorySection({ entityType, entityId, title = 'Tarix' }) {
  const { data, loading, error } = useAsync(() => timelineService.get(entityType, entityId), [entityType, entityId])
  const items = data?.items ?? data ?? []

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
