import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownDivider } from '../../components/Dropdown/Dropdown'
import { Avatar } from '../../components/Avatar/Avatar'
import { ChevronDownIcon, UserIcon, SettingsIcon, LogOutIcon } from '../../components/icons/Icons'
import { useAuth } from '../../features/auth/useAuth'
import { usePermissions } from '../../features/roles/usePermissions'
import { ROLE_LABELS } from '../../features/roles/permissions'
import './UserMenu.scss'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Dropdown
      trigger={(toggle, isOpen) => (
        <button type="button" className="user-menu-trigger" onClick={toggle} aria-expanded={isOpen}>
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
          <span className="user-menu-trigger__meta">
            <div className="user-menu-trigger__name">{user?.name || 'Foydalanuvchi'}</div>
            <div className="user-menu-trigger__role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </span>
          <ChevronDownIcon width={14} height={14} />
        </button>
      )}
    >
      <DropdownItem onClick={() => navigate('/admin/profile')}>
        <UserIcon width={16} height={16} /> Profil
      </DropdownItem>
      {can('settings.view') && (
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
