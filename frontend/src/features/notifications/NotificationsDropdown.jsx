import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownLabel, DropdownDivider } from '../../components/Dropdown/Dropdown'
import { classNames } from '../../utils/classNames'
import { formatDateTime } from '../../utils/formatDate'
import { BellIcon, InboxIcon, UserIcon, BuildingIcon, DashboardIcon, TeamIcon } from '../../components/icons/Icons'
import { useNotifications } from './NotificationsContext'
import { getNotificationHref } from './notificationUtils'
import './NotificationsDropdown.scss'

// notification.type is expected to be one of: task/lead/deal/payment/
// installation/follow-up (see spec §14) — matched by prefix so the backend
// can send specific variants (e.g. "task_assigned") without the frontend
// needing an exact enum.
const TYPE_ICONS = [
  { prefix: 'task', Icon: InboxIcon },
  { prefix: 'lead', Icon: UserIcon },
  { prefix: 'deal', Icon: BuildingIcon },
  { prefix: 'payment', Icon: DashboardIcon },
  { prefix: 'installation', Icon: TeamIcon },
  { prefix: 'follow', Icon: BellIcon },
]

function NotificationTypeIcon({ type }) {
  const match = TYPE_ICONS.find((entry) => type?.toLowerCase().startsWith(entry.prefix))
  const Icon = match?.Icon || InboxIcon
  return <Icon width={16} height={16} />
}

export function NotificationsDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()

  const handleClick = (notification) => {
    if (!notification.isRead) markRead(notification.id)
    const href = getNotificationHref(notification)
    if (href) navigate(href)
  }

  return (
    <Dropdown
      trigger={(toggle, isOpen) => (
        <button type="button" className="header__icon-btn" onClick={toggle} aria-expanded={isOpen} aria-label="Bildirishnomalar">
          <BellIcon />
          {unreadCount > 0 && <span className="header__notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
      )}
    >
      <div className="notifications-dropdown">
        <DropdownLabel>
          Bildirishnomalar {unreadCount > 0 && `(${unreadCount})`}
        </DropdownLabel>
        {notifications.length === 0 ? (
          <div className="notifications-dropdown__empty">Yangi bildirishnoma yo‘q</div>
        ) : (
          <ul className="notifications-dropdown__list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className={classNames('notifications-dropdown__item', !notification.isRead && 'notifications-dropdown__item--unread', notification.isOverdue && 'notifications-dropdown__item--overdue')}
                  onClick={() => handleClick(notification)}
                >
                  <span className="notifications-dropdown__icon">
                    <NotificationTypeIcon type={notification.type} />
                  </span>
                  <span className="notifications-dropdown__body">
                    <span className="notifications-dropdown__title">{notification.title}</span>
                    <span className="notifications-dropdown__message">{notification.message}</span>
                    <span className="notifications-dropdown__date">{formatDateTime(notification.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownDivider />
            <button type="button" className="dropdown__item" onClick={markAllRead}>
              Barchasini o‘qilgan deb belgilash
            </button>
          </>
        )}
        <DropdownDivider />
        <button type="button" className="dropdown__item" onClick={() => navigate('/admin/notifications')}>Barcha bildirishnomalar</button>
      </div>
    </Dropdown>
  )
}
