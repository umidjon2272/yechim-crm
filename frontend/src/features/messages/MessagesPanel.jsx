import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useAction } from '../../hooks/useAction'
import { customersService } from '../../services/customers.service'
import { Card } from '../../components/Card/Card'
import { Spinner } from '../../components/Spinner/Spinner'
import { Alert } from '../../components/Alert/Alert'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Button } from '../../components/Button/Button'
import { InboxIcon, PlusIcon } from '../../components/icons/Icons'
import { classNames } from '../../utils/classNames'
import { formatDateTime } from '../../utils/formatDate'
import './MessagesPanel.scss'

// Frontend-only demo conversation (see api/demoEngine.js's `messages`
// resource) — same entityId convention as comments/attachments, so wiring a
// real messenger backend later means swapping the service call, not this UI.
// variant="flush" drops the Card chrome/title and fills its parent's height
// with a sticky composer — used as the Customer Workspace's main column,
// where chat has to be visible immediately, not one click away.
export function MessagesPanel({ customerId, variant = 'card' }) {
  const { data, loading, error, refetch } = useAsync(() => customersService.getMessages(customerId), [customerId])
  const [text, setText] = useState('')
  const sendAction = useAction((value) => customersService.sendMessage(customerId, value))

  const messages = data?.items ?? []

  const handleSend = async (event) => {
    event.preventDefault()
    if (!text.trim()) return
    try {
      await sendAction.run(text.trim())
      setText('')
      refetch()
    } catch {
      // Non-critical demo panel — the send button's own disabled/loading
      // state already communicates a failed attempt, no toast needed.
    }
  }

  const body = (
    <>
      {error && (
        <Alert variant="danger" title="Yozishmalarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}
      {loading && !error && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}
      {!loading && !error && messages.length === 0 && (
        <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Hali yozishma yo‘q" description="Birinchi xabarni pastdan yozing." />
      )}
      {!loading && !error && messages.length > 0 && (
        <div className="messages-panel__thread">
          {messages.map((message) => (
            <div
              key={message.id}
              className={classNames('messages-panel__bubble-row', message.senderType === 'employee' && 'messages-panel__bubble-row--me')}
            >
              <div className="messages-panel__bubble">
                <div className="messages-panel__bubble-text">{message.text}</div>
                <div className="messages-panel__bubble-meta">
                  {message.senderName} · {formatDateTime(message.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const composer = (
    <form className="messages-panel__composer" onSubmit={handleSend}>
      <input
        className="messages-panel__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Xabar yozing..."
        disabled={sendAction.loading}
      />
      <Button type="submit" loading={sendAction.loading} disabled={!text.trim()}>
        {variant === 'flush' ? <PlusIcon width={16} height={16} /> : 'Yuborish'}
      </Button>
    </form>
  )

  if (variant === 'flush') {
    return (
      <div className="messages-panel messages-panel--flush">
        <div className="messages-panel__scroll">{body}</div>
        {composer}
      </div>
    )
  }

  return (
    <Card title="Yozishmalar">
      {body}
      {composer}
    </Card>
  )
}
