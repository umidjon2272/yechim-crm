import { formatDate } from '../../utils/formatDate'
import { EmptyState } from '../EmptyState/EmptyState'
import { InboxIcon } from '../icons/Icons'
import './Timeline.scss'

const TYPE_LABELS = {
  CALL: 'Qo‘ng‘iroq',
  MEETING: 'Uchrashuv',
  DEMO: 'Demo',
  NOTE: 'Izoh',
  // Synthesized cross-entity history events (see features/timeline) — not
  // logged manually like the types above, they're derived from other
  // records (lead/deal/quotation/payment/installation/task state).
  LEAD_CREATED: 'Murojaat yaratildi',
  STAGE_CHANGED: 'Bosqich o‘zgardi',
  QUOTATION_CREATED: 'Taklif yaratildi',
  PAYMENT_RECEIVED: 'To‘lov qabul qilindi',
  INSTALLATION_SCHEDULED: 'O‘rnatish rejalashtirildi',
  INSTALLATION_COMPLETED: 'O‘rnatish yakunlandi',
  TASK_COMPLETED: 'Vazifa bajarildi',
  CUSTOMER_CREATED: 'Mijoz yaratildi',
  PROGRAM_ADDED: 'Dastur qo‘shildi',
}

function groupByDate(items) {
  const groups = new Map()
  for (const item of items) {
    const key = formatDate(item.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return Array.from(groups.entries())
}

export function Timeline({ items = [] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        icon={<InboxIcon width={20} height={20} />}
        title="Hali faoliyat yo‘q"
        description="Qo‘ng‘iroq, uchrashuv, demo yoki izoh qo‘shilgach shu yerda ko‘rinadi."
      />
    )
  }

  const groups = groupByDate(items)

  return (
    <div className="timeline">
      {groups.map(([date, groupItems]) => (
        <div key={date} className="timeline__group">
          <div className="timeline__date">{date}</div>
          <div className="timeline__items">
            {groupItems.map((item) => (
              <div key={item.id} className="timeline__item">
                <span className="timeline__dot" />
                <div className="timeline__content">
                  <div className="timeline__title">
                    <span className="timeline__type">{TYPE_LABELS[item.type] || item.type}</span>
                    {item.employeeName && <span> — {item.employeeName}</span>}
                  </div>
                  {item.title && <div className="timeline__subject">{item.title}</div>}
                  {item.description && <div className="timeline__description">{item.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
