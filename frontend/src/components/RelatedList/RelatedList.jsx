import { useNavigate } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { Card } from '../Card/Card'
import { Spinner } from '../Spinner/Spinner'
import { EmptyState } from '../EmptyState/EmptyState'
import { InboxIcon } from '../icons/Icons'
import './RelatedList.scss'

/**
 * Generic "related records" card used on every detail page (Customer's
 * Businesses/Leads/Deals/..., Business's Leads/Deals/..., etc). Generalizes
 * the inline pattern first prototyped in EmployeeDetailPage's
 * RelationshipSection. Handles loading/empty/error itself via useAsync so
 * every detail page gets identical, honest behavior against endpoints that
 * may not exist on the backend yet.
 */
export function RelatedList({ title, fetcher, deps, renderItem, emptyHint, linkTo, action }) {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(fetcher, deps)
  const items = data?.items ?? data ?? []

  return (
    <Card title={title} actions={action}>
      {loading && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <EmptyState
          compact
          icon={<InboxIcon width={20} height={20} />}
          title="Hozircha ma'lumot yo‘q"
          description={emptyHint}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="related-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={linkTo ? 'related-list__item related-list__item--clickable' : 'related-list__item'}
              onClick={linkTo ? () => navigate(linkTo(item)) : undefined}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
