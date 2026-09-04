import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../../components/Dropdown/Dropdown'
import { Avatar } from '../../components/Avatar/Avatar'
import { ChevronDownIcon, UserIcon, SettingsIcon, LogOutIcon } from '../../components/icons/Icons'
import { useAuth } from '../../features/auth/useAuth'
import { usePermissions } from '../../features/roles/usePermissions'
import { ROLE_LABELS } from '../../features/roles/permissions'
import { classNames } from '../../utils/classNames'
import './UserMenu.scss'

export function UserMenu({ variant = 'header' }) {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const isPartner = user?.role === 'PARTNER'
  const roleLabel = isPartner ? 'Partner' : ROLE_LABELS[user?.role] || user?.role

  return (
    <Dropdown
      trigger={(toggle, isOpen) => (
        <button type="button" className={classNames('user-menu-trigger', `user-menu-trigger--${variant}`)} onClick={toggle} aria-expanded={isOpen}>
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
          <span className="user-menu-trigger__meta">
            <div className="user-menu-trigger__name">{user?.name || 'Foydalanuvchi'}</div>
            <div className="user-menu-trigger__role">{roleLabel}</div>
          </span>
          <ChevronDownIcon width={14} height={14} />
        </button>
      )}
    >
      <DropdownLabel>
        <span className="user-menu__identity-name">{user?.name || 'Foydalanuvchi'}</span>
        <span className="user-menu__identity-role">{roleLabel}</span>
      </DropdownLabel>
      <DropdownItem onClick={() => navigate('/admin/profile')}>
        <UserIcon width={16} height={16} /> Profil
      </DropdownItem>
      {(can('settings.view') || can('programs.view')) && (
        <DropdownItem onClick={() => navigate('/admin/settings')}>
          <SettingsIcon width={16} height={16} /> Sozlamalar
        </DropdownItem>
      )}
      <DropdownDivider />
      <DropdownItem danger onClick={handleLogout}>
        <LogOutIcon width={16} height={16} /> Chiqish
      </DropdownItem>
    </Dropdown>
  )
}
