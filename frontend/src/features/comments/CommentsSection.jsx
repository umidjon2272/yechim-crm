import { useState } from 'react'
import { commentsService } from '../../services/comments.service'
import { useAsync } from '../../hooks/useAsync'
import { useAction } from '../../hooks/useAction'
import { useAuth } from '../auth/useAuth'
import { usePermissions } from '../roles/usePermissions'
import { Card } from '../../components/Card/Card'
import { Avatar } from '../../components/Avatar/Avatar'
import { Button } from '../../components/Button/Button'
import { Spinner } from '../../components/Spinner/Spinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { formatDateTime } from '../../utils/formatDate'
import { InboxIcon } from '../../components/icons/Icons'
import './CommentsSection.scss'

/**
 * Reusable comment thread — attach to Customer/Business/Lead/Deal/Task/
 * Installation detail pages via `entityType`+`entityId`. Edit/delete are
 * gated by the `comments.create` permission plus an author check (UI-only,
 * backend must enforce the real rule).
 */
export function CommentsSection({ entityType, entityId }) {
  const { user } = useAuth()
  const { can } = usePermissions()
  const { data, loading, error, refetch } = useAsync(() => commentsService.list(entityType, entityId), [entityType, entityId])
  const createAction = useAction(commentsService.create)
  const removeAction = useAction(commentsService.remove)
  const [text, setText] = useState('')

  const comments = data?.items ?? data ?? []

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!text.trim()) return
    try {
      await createAction.run({ entityType, entityId, text: text.trim() })
      setText('')
      refetch()
    } catch {
      // createAction.error surfaces below
    }
  }

  const handleDelete = async (id) => {
    try {
      await removeAction.run(id)
      refetch()
    } catch {
      // removeAction.error surfaces below
    }
  }

  return (
    <Card title="Izohlar">
      {can('comments.create') && (
        <form onSubmit={handleSubmit} className="comment-form">
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
          <textarea
            className="textarea"
            placeholder="Izoh yozing..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={createAction.loading}
            rows={2}
          />
          <Button type="submit" size="sm" loading={createAction.loading} disabled={!text.trim()}>
            Yuborish
          </Button>
        </form>
      )}

      {createAction.error && <p className="form-field__error">{createAction.error.message}</p>}

      {loading && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}

      {!loading && (error || comments.length === 0) && (
        <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Hali izoh yo‘q" />
      )}

      {!loading && !error && comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-list__item">
              <Avatar name={comment.author?.name} src={comment.author?.avatarUrl} size="sm" />
              <div className="comment-list__body">
                <div className="comment-list__meta">
                  <span className="comment-list__author">{comment.author?.name || 'Foydalanuvchi'}</span>
                  <span className="comment-list__date">{formatDateTime(comment.createdAt)}</span>
                </div>
                <div className="comment-list__text">{comment.text}</div>
              </div>
              {can('comments.create') && comment.author?.id === user?.id && (
                <button
                  type="button"
                  className="dropdown__item dropdown__item--danger"
                  style={{ width: 'auto' }}
                  onClick={() => handleDelete(comment.id)}
                  disabled={removeAction.loading}
                >
                  O‘chirish
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
