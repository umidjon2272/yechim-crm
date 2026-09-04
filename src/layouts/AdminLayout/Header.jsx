import { useUI } from '../../store/UIContext'
import { MenuIcon } from '../../components/icons/Icons'
import { UserMenu } from './UserMenu'
import { NotificationsDropdown } from '../../features/notifications/NotificationsDropdown'
import { useAuth } from '../../features/auth/useAuth'
import { classNames } from '../../utils/classNames'
import './Header.scss'

export function Header({ title, className }) {
  const { openMobileSidebar } = useUI()
  const { user } = useAuth()

  return (
    <header className={classNames('header', className)}>
      <div className="header__left">
        <button type="button" className="header__menu-btn" onClick={openMobileSidebar} aria-label="Menyuni ochish">
          <MenuIcon />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>
      <div className="header__right">
        {user?.role !== 'PARTNER' && <NotificationsDropdown />}
        <UserMenu />
      </div>
    </header>
  )
}
