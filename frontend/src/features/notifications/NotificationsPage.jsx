import { useNavigate } from 'react-router-dom'
import { Alert } from '../../components/Alert/Alert'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Spinner } from '../../components/Spinner/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { formatDateTime } from '../../utils/formatDate'
import { useNotifications } from './NotificationsContext'
import { getNotificationHref } from './notificationUtils'
import { notificationsService } from '../../services/notifications.service'
import { TodayWorkPanel } from '../customers/components/TodayWorkPanel'
import { BellIcon } from '../../components/icons/Icons'
import './NotificationsPage.scss'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useAsync(() => notificationsService.list({ pageSize: 200 }), [])
  const { markRead, markAllRead } = useNotifications()
  const notifications = data?.items ?? []
  const unreadCount = notifications.filter((item) => !item.isRead).length

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification.id)
      refetch().catch(() => {})
    }
    const href = getNotificationHref(notification)
    if (href) navigate(href)
  }

  const readAll = async () => {
    await markAllRead()
    await refetch()
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Bildirishnomalar</h2>
          <p className="page-header__subtitle">Tasklar va customer eslatmalari</p>
        </div>
        {unreadCount > 0 && <Button variant="secondary" onClick={readAll}>Barchasini o‘qilgan qilish</Button>}
      </div>

      <TodayWorkPanel />

      {error && <Alert variant="danger" title="Bildirishnomalarni yuklab bo‘lmadi">{error.message}</Alert>}
      {loading && !error && <div className="page-loading"><Spinner size="lg" /></div>}
      {!loading && !error && notifications.length === 0 && <EmptyState icon={<BellIcon width={22} height={22} />} title="Bildirishnomalar yo‘q" description="Yangi task yoki eslatma kelganda shu yerda ko‘rinadi." />}

      {!loading && !error && notifications.length > 0 && (
        <div className="notifications-page__list">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`notifications-page__item${notification.isRead ? '' : ' notifications-page__item--unread'}${notification.isOverdue ? ' notifications-page__item--overdue' : ''}`}
              onClick={() => openNotification(notification)}
            >
              <span className="notifications-page__icon"><BellIcon width={18} height={18} /></span>
              <span className="notifications-page__body">
                <span className="notifications-page__topline">
                  <span className="notifications-page__title">{notification.title}</span>
                  {!notification.isRead && <Badge variant="info">Yangi</Badge>}
                  {notification.isOverdue && <Badge variant="danger">Kechikkan</Badge>}
                </span>
                <span className="notifications-page__message">{notification.message}</span>
                <span className="notifications-page__date">{formatDateTime(notification.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
