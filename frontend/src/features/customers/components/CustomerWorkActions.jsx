import { useEffect, useMemo, useState } from 'react'
import { activitiesService } from '../../../services/activities.service'
import { remindersService } from '../../../services/reminders.service'
import { tasksService } from '../../../services/tasks.service'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../store/ToastContext'
import { Button } from '../../../components/Button/Button'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Modal } from '../../../components/Modal/Modal'
import { Timeline } from '../../../components/Timeline/Timeline'
import { formatDateTime } from '../../../utils/formatDate'
import { timelineService } from '../../../services/timeline.service'
import './CustomerWorkActions.scss'

function localInputValue(date) {
  const value = new Date(date)
  value.setMinutes(Math.ceil(value.getMinutes() / 15) * 15, 0, 0)
  const pad = (number) => String(number).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function quickDate(days) {
  const value = new Date()
  value.setDate(value.getDate() + days)
  value.setHours(14, 0, 0, 0)
  return localInputValue(value)
}

export function ReminderModal({ open, customer, type = 'CALL', onClose, onCreated }) {
  const [remindAt, setRemindAt] = useState(() => quickDate(0))
  const createAction = useAction(remindersService.create)
  const toast = useToast()

  useEffect(() => {
    if (open) setRemindAt(quickDate(0))
  }, [open])

  const submit = async () => {
    try {
      await createAction.run({ customerId: customer.id, remindAt: new Date(remindAt).toISOString(), type })
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
      title={type === 'REPEAT_SALE' ? 'Keyingi sotuv eslatmasi' : 'Qo\'ng\'iroqni rejalash'}
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
        <Input type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} />
      </FormField>
    </Modal>
  )
}

export function QuickActionModal({ action, customer, onClose, onChanged }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const createNote = useAction(activitiesService.create)
  const createTask = useAction(tasksService.create)
  const toast = useToast()
  const title = action === 'NOTE' ? 'Tez izoh' : 'Vazifa yaratish'

  useEffect(() => {
    if (action) {
      setText('')
      setDueDate('')
    }
  }, [action])

  const submit = async () => {
    if (!text.trim()) return
    try {
      if (action === 'NOTE') await createNote.run({ customerId: customer.id, type: 'NOTE', message: text.trim() })
      else await createTask.run({ customerId: customer.id, title: text.trim(), dueDate: dueDate || null })
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
        <textarea className="textarea" rows={3} value={text} onChange={(event) => setText(event.target.value)} autoFocus placeholder={action === 'NOTE' ? 'Masalan: Direktor bilan narxni kelishadi' : 'Masalan: Mijoz bilan bog\'lanish'} />
      </FormField>
      {action === 'TASK' && <FormField label="Muddat" hint="Ixtiyoriy"><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></FormField>}
    </Modal>
  )
}

export function CustomerWorkPanel({ customer, onChanged }) {
  const [action, setAction] = useState(null)
  const [reminderType, setReminderType] = useState(null)
  const { data, loading, refetch } = useAsync(() => timelineService.get('customer', customer.id), [customer.id])
  const items = data?.items ?? data ?? []
  const latestNote = useMemo(() => items.find((item) => item.type === 'NOTE'), [items])
  const handleChanged = () => {
    refetch()
    onChanged?.()
  }

  return (
    <div className="customer-work-panel">
      <div className="customer-work-panel__header">
        <strong>Keyingi ish</strong>
        {customer.nextContactAt ? <span className={customer.isFollowUpOverdue ? 'customer-work-panel__overdue' : ''}>{customer.isFollowUpOverdue ? 'Aloqa kechikdi' : formatDateTime(customer.nextContactAt)}</span> : <span className="text-muted">Belgilanmagan</span>}
      </div>
      {latestNote && <div className="customer-work-panel__note"><span>Oxirgi izoh</span>{latestNote.description || latestNote.message}</div>}
      <div className="customer-work-panel__actions">
        <Button size="sm" variant="secondary" onClick={() => setReminderType('CALL')}>📞 Qo'ng'iroq</Button>
        <Button size="sm" variant="secondary" onClick={() => setReminderType('REPEAT_SALE')}>⏰ Eslatma</Button>
        <Button size="sm" variant="secondary" onClick={() => setAction('TASK')}>✓ Vazifa</Button>
        <Button size="sm" variant="secondary" onClick={() => setAction('NOTE')}>✎ Izoh</Button>
      </div>
      <div className="customer-work-panel__timeline">
        <strong>Tarix</strong>
        {loading ? <span className="text-muted text-xs">Yuklanmoqda...</span> : <Timeline items={items.slice(0, 8)} />}
      </div>
      <QuickActionModal action={action} customer={customer} onClose={() => setAction(null)} onChanged={handleChanged} />
      <ReminderModal open={Boolean(reminderType)} type={reminderType || 'CALL'} customer={customer} onClose={() => setReminderType(null)} onCreated={handleChanged} />
    </div>
  )
}
