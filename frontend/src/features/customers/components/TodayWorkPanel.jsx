import { useState } from 'react'
import { remindersService } from '../../../services/reminders.service'
import { useAsync } from '../../../hooks/useAsync'
import { Modal } from '../../../components/Modal/Modal'
import { Spinner } from '../../../components/Spinner/Spinner'
import './TodayWorkPanel.scss'

export function TodayWorkPanel() {
  const [open, setOpen] = useState(false)
  const { data, loading } = useAsync(remindersService.todayWork, [])
  const counts = data?.counts || { calls: 0, tasks: 0, installations: 0 }
  const items = data?.items || { reminders: [], tasks: [], installations: [] }

  return (
    <>
      <button type="button" className="today-work-panel" onClick={() => setOpen(true)}>
        <span className="today-work-panel__title">Bugun</span>
        <span>{counts.calls} qo'ng'iroq</span>
        <span>{counts.tasks} vazifa</span>
        <span>{counts.installations} o'rnatish</span>
        <span className="today-work-panel__arrow">Ochish →</span>
      </button>
      <Modal open={open} title="Bugungi ishlar" onClose={() => setOpen(false)}>
        {loading ? <div className="page-loading"><Spinner /></div> : <div className="today-work-list">
          <section><strong>Qo'ng'iroqlar</strong>{items.reminders.length ? items.reminders.map((item) => <div className="today-work-list__item" key={item.id}>{item.title}<small>{item.note || new Date(item.remindAt).toLocaleString('uz-UZ')}</small></div>) : <p className="text-muted text-xs">Bugun qo'ng'iroq yo'q.</p>}</section>
          <section><strong>Vazifalar</strong>{items.tasks.length ? items.tasks.map((item) => <div className="today-work-list__item" key={item.id}>{item.title}<small>{item.description || item.customer?.name || 'Mijozsiz'}</small></div>) : <p className="text-muted text-xs">Bugun vazifa yo'q.</p>}</section>
          <section><strong>O'rnatishlar</strong>{items.installations.length ? items.installations.map((item) => <div className="today-work-list__item" key={item.id}>{item.customer?.name || 'Mijoz'}<small>{item.scheduledDate ? new Date(item.scheduledDate).toLocaleString('uz-UZ') : 'Sana belgilanmagan'}</small></div>) : <p className="text-muted text-xs">Bugun o'rnatish yo'q.</p>}</section>
        </div>}
      </Modal>
    </>
  )
}
