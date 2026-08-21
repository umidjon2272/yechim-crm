import { useEffect, useState } from 'react'
import { activitiesService } from '../../../services/activities.service'
import { commentsService } from '../../../services/comments.service'
import { remindersService } from '../../../services/reminders.service'
import { tasksService } from '../../../services/tasks.service'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../store/ToastContext'
import { Button } from '../../../components/Button/Button'
import { FormField } from '../../../components/FormField/FormField'
import { Modal } from '../../../components/Modal/Modal'
import { DateTimePicker } from '../../../components/DateTimePicker/DateTimePicker'
import { Timeline } from '../../../components/Timeline/Timeline'
import { ErrorBoundary } from '../../../components/ErrorBoundary/ErrorBoundary'
import { formatDateTime } from '../../../utils/formatDate'
import { localDateTimeFromNow, localDateTimeToISOString } from '../../../utils/dateTime'
import { timelineService } from '../../../services/timeline.service'
import { PermissionGate } from '../../roles/PermissionGate'
import { usePermissions } from '../../roles/usePermissions'
import './CustomerWorkActions.scss'

function quickDate(days) {
  return localDateTimeFromNow(days, 14, 0)
}

export function ReminderModal({ open, customer, type = 'CALL', onClose, onCreated }) {
  const [remindAt, setRemindAt] = useState(() => quickDate(0))
  const [note, setNote] = useState('')
  const createAction = useAction(remindersService.create)
  const toast = useToast()

  useEffect(() => {
    if (open) {
      setRemindAt(quickDate(0))
      setNote('')
    }
  }, [open])

  const submit = async () => {
    try {
      await createAction.run({ customerId: customer.id, remindAt: localDateTimeToISOString(remindAt), type, note: note.trim() || null })
      toast.success('Eslatma saqlandi')
      onCreated?.()
      onClose()
    } catch (error) {
      toast.error(error.message || 'Eslatmani saqlab bo\'lmadi')
    }
  }

  return (
    <Modal
      open={open}
      title={type === 'REPEAT_SALE' ? 'Keyingi sotuv eslatmasi' : "Qo'ng'iroqni rejalash"}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={submit} loading={createAction.loading} disabled={!remindAt}>Saqlash</Button></>}
    >
      <p className="text-muted">{customer?.name} uchun keyingi aloqa vaqtini tanlang.</p>
      <div className="quick-date-row">
        {[{ days: 0, label: 'Bugun' }, { days: 1, label: 'Ertaga' }, { days: 3, label: '3 kundan keyin' }, { days: 7, label: '1 hafta' }].map((item) => (
          <Button key={item.days} type="button" size="sm" variant="secondary" onClick={() => setRemindAt(quickDate(item.days))}>{item.label}</Button>
        ))}
      </div>
      <FormField label="Sana va vaqt">
        <DateTimePicker value={remindAt} onChange={(event) => setRemindAt(event.target.value)} />
      </FormField>
      <FormField label="Izoh / Kommentariya" hint="Ixtiyoriy">
        <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Masalan: Narxni direktor bilan kelishish" />
      </FormField>
    </Modal>
  )
}

export function QuickActionModal({ action, customer, onClose, onChanged }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [taskNote, setTaskNote] = useState('')
  const createNote = useAction(activitiesService.create)
  const createTask = useAction(tasksService.create)
  const toast = useToast()
  const title = action === 'NOTE' ? 'Tez izoh' : 'Vazifa yaratish'

  useEffect(() => {
    if (action) {
      setText('')
      setDueDate('')
      setTaskNote('')
    }
  }, [action])

  const submit = async () => {
    if (!text.trim()) return
    try {
      if (action === 'NOTE') await createNote.run({ customerId: customer.id, type: 'NOTE', message: text.trim() })
      else await createTask.run({ customerId: customer.id, title: text.trim(), description: taskNote.trim() || null, dueDate: localDateTimeToISOString(dueDate) })
      toast.success(action === 'NOTE' ? 'Izoh qo\'shildi' : 'Vazifa yaratildi')
      onChanged?.()
      onClose()
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik yuz berdi')
    }
  }

  return (
    <Modal
      open={Boolean(action)}
      title={title}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={submit} loading={createNote.loading || createTask.loading} disabled={!text.trim()}>Saqlash</Button></>}
    >
      <FormField label={action === 'NOTE' ? 'Izoh' : 'Vazifa nomi'}>
        <textarea className="textarea" rows={3} value={text} onChange={(event) => setText(event.target.value)} autoFocus placeholder={action === 'NOTE' ? 'Masalan: Direktor bilan narxni kelishadi' : "Masalan: Mijoz bilan bog'lanish"} />
      </FormField>
      {action === 'TASK' && <FormField label="Muddat" hint="Ixtiyoriy"><DateTimePicker value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></FormField>}
      {action === 'TASK' && <FormField label="Izoh / Kommentariya" hint="Ixtiyoriy"><textarea className="textarea" rows={3} value={taskNote} onChange={(event) => setTaskNote(event.target.value)} /></FormField>}
    </Modal>
  )
}

function InlineCustomerComment({ customer, onChanged }) {
  const { can } = usePermissions()
  const canView = can('comments.view')
  const canCreate = can('comments.create')
  const createAction = useAction(commentsService.create)
  const toast = useToast()
  const [text, setText] = useState('')

  if (!canView) return null

  const submit = async (event) => {
    event.preventDefault()
    const message = text.trim()
    if (!message) return
    try {
      await createAction.run({ entityType: 'customer', entityId: customer.id, text: message })
      setText('')
      toast.success('Izoh qo\'shildi')
      onChanged?.()
    } catch (error) {
      toast.error(error.message || 'Izohni saqlab bo\'lmadi')
    }
  }

  return (
    <section className="customer-inline-comment" aria-label="Izoh">
      <div className="customer-inline-comment__title">Izoh</div>
      {customer.latestNote?.message && <div className="customer-inline-comment__latest">
        <span>Oxirgi izoh</span>
        <p>{customer.latestNote.message}</p>
        {(customer.latestNote.createdBy?.name || customer.latestNote.createdAt) && <small>
          {customer.latestNote.createdBy?.name || ''}{customer.latestNote.createdBy?.name && customer.latestNote.createdAt ? ' · ' : ''}{customer.latestNote.createdAt ? formatDateTime(customer.latestNote.createdAt) : ''}
        </small>}
      </div>}
      {canCreate && <form className="customer-inline-comment__form" onSubmit={submit}>
        <textarea
          className="textarea"
          rows={3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={createAction.loading}
          placeholder="Mijoz haqida izoh yozing..."
        />
        <div className="customer-inline-comment__actions">
          <Button type="submit" size="sm" loading={createAction.loading} disabled={!text.trim()}>Saqlash</Button>
        </div>
      </form>}
      {createAction.error && <p className="form-field__error">{createAction.error.message}</p>}
    </section>
  )
}

export function CustomerWorkPanel({ customer, onChanged }) {
  const [action, setAction] = useState(null)
  const [reminderType, setReminderType] = useState(null)
  const { can } = usePermissions()
  const canSeeHistory = can('history.view')
  const { data, error, loading, refetch } = useAsync(() => canSeeHistory ? timelineService.get('customer', customer.id) : Promise.resolve({ items: [] }), [customer.id, canSeeHistory])
  const rawItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
  const items = rawItems.filter((item) => item && typeof item === 'object')
  const handleChanged = () => {
    refetch()
    onChanged?.()
  }

  return (
    <>
      <InlineCustomerComment customer={customer} onChanged={handleChanged} />
      <div className="customer-work-panel">
      <div className="customer-work-panel__header">
        <strong>Keyingi ish</strong>
        {customer.nextContactAt ? <span className={customer.isFollowUpOverdue ? 'customer-work-panel__overdue' : ''}>{customer.isFollowUpOverdue ? 'Aloqa kechikdi' : formatDateTime(customer.nextContactAt)}</span> : <span className="text-muted">Belgilanmagan</span>}
      </div>
      <div className="customer-work-panel__actions">
        <PermissionGate permission="calls.create"><Button size="sm" variant="secondary" onClick={() => setReminderType('CALL')}>Qo'ng'iroq</Button></PermissionGate>
        <PermissionGate permission="reminders.create"><Button size="sm" variant="secondary" onClick={() => setReminderType('REPEAT_SALE')}>Eslatma</Button></PermissionGate>
        <PermissionGate permission="tasks.create"><Button size="sm" variant="secondary" onClick={() => setAction('TASK')}>Vazifa</Button></PermissionGate>
      </div>
      {canSeeHistory && <div className="customer-work-panel__timeline">
        <strong>Tarix</strong>
        {loading ? <span className="text-muted text-xs">Yuklanmoqda...</span> : error ? (
          <div className="text-muted text-xs">
            <span>Tarixni yuklab bo‘lmadi.</span>{' '}
            <Button size="sm" variant="ghost" onClick={() => refetch().catch(() => {})}>Qayta urinish</Button>
          </div>
        ) : <ErrorBoundary
          resetKey={`${customer.id}-${loading}-${items.length}`}
          fallback={<span className="text-muted text-xs">Tarixni ko‘rsatib bo‘lmadi.</span>}
        >
          <Timeline items={items.slice(0, 8)} />
        </ErrorBoundary>}
      </div>}
      <QuickActionModal action={action} customer={customer} onClose={() => setAction(null)} onChanged={handleChanged} />
      <ReminderModal open={Boolean(reminderType)} type={reminderType || 'CALL'} customer={customer} onClose={() => setReminderType(null)} onCreated={handleChanged} />
      </div>
    </>
  )
}
