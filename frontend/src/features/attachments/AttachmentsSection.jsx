import { useRef } from 'react'
import { attachmentsService } from '../../services/attachments.service'
import { useAsync } from '../../hooks/useAsync'
import { useAction } from '../../hooks/useAction'
import { usePermissions } from '../roles/usePermissions'
import { Card } from '../../components/Card/Card'
import { Button } from '../../components/Button/Button'
import { Spinner } from '../../components/Spinner/Spinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Alert } from '../../components/Alert/Alert'
import { formatDate } from '../../utils/formatDate'
import { InboxIcon } from '../../components/icons/Icons'
import './AttachmentsSection.scss'

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Reusable attachment list — attach to Customer/Business/Lead/Deal/
 * Quotation/Installation detail pages via `entityType`+`entityId`. Upload is
 * a real multipart request against a backend endpoint that doesn't exist
 * yet — it will show the real error until the backend ships it. No fake
 * "uploaded successfully" state is ever shown.
 */
export function AttachmentsSection({ entityType, entityId }) {
  const { can } = usePermissions()
  const { data, loading, error, refetch } = useAsync(() => attachmentsService.list(entityType, entityId), [entityType, entityId])
  const uploadAction = useAction((file) => attachmentsService.upload(entityType, entityId, file))
  const removeAction = useAction(attachmentsService.remove)
  const inputRef = useRef(null)

  const attachments = data?.items ?? data ?? []

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await uploadAction.run(file)
      refetch()
    } catch {
      // uploadAction.error surfaces below
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
    <Card
      title="Fayllar"
      actions={
        can('attachments.create') && (
          <>
            <input ref={inputRef} type="file" hidden onChange={handleFileChange} />
            <Button size="sm" variant="secondary" loading={uploadAction.loading} onClick={() => inputRef.current?.click()}>
              Fayl yuklash
            </Button>
          </>
        )
      }
    >
      {uploadAction.error && (
        <Alert variant="danger" title="Fayl yuklanmadi">
          {uploadAction.error.message}
        </Alert>
      )}

      {loading && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}

      {!loading && (error || attachments.length === 0) && (
        <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Fayllar yo‘q" />
      )}

      {!loading && !error && attachments.length > 0 && (
        <ul className="attachment-list">
          {attachments.map((file) => (
            <li key={file.id} className="attachment-list__item">
              <div className="attachment-list__meta">
                <a href={file.url} target="_blank" rel="noreferrer" className="attachment-list__name">
                  {file.name}
                </a>
                <span className="attachment-list__sub">
                  {formatFileSize(file.size)} · {file.uploadedBy?.name || 'Noma’lum'} · {formatDate(file.createdAt)}
                </span>
              </div>
              {can('attachments.create') && (
                <button
                  type="button"
                  className="dropdown__item dropdown__item--danger"
                  style={{ width: 'auto' }}
                  onClick={() => handleDelete(file.id)}
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
