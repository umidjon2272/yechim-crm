import { NavLink, useLocation } from 'react-router-dom'
import { classNames } from '../../utils/classNames'
import { useUI } from '../../store/UIContext'
import { usePermissions } from '../../features/roles/usePermissions'
import { BuildingIcon, SettingsIcon, ChevronLeftIcon, InboxIcon, UsersIcon } from '../../components/icons/Icons'
import { UserMenu } from './UserMenu'
import './Sidebar.scss'

// Bitrix24-style hub: everything customer-related (business, lead, deal,
// quotation, product, installation, task, call, note, file) is reached from
// the Customer detail page's tabs, not from a separate top-level module per
// entity — so the CRM submenu only lists the handful of list pages that need
// their own dedicated queue view, not every entity in the data model.
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUI()
  const { can } = usePermissions()
  const location = useLocation()

  const crmSectionActive = location.pathname.startsWith('/admin/crm') && !location.pathname.startsWith('/admin/crm/tasks')

  return (
    <>
      <aside
        className={classNames(
          'sidebar',
          sidebarCollapsed && 'sidebar--collapsed',
          mobileSidebarOpen && 'sidebar--mobile-open'
        )}
      >
        <div className="sidebar__brand">
          <span className="sidebar__logo-mark">Y</span>
          <span className="sidebar__logo-text">YECHIM</span>
        </div>

        <nav className="sidebar__nav">
          {can('customers.view') && (
            <NavLink
              to="/admin/crm/customers"
              className={({ isActive }) => classNames('sidebar__link', (isActive || crmSectionActive) && 'sidebar__link--active')}
              onClick={closeMobileSidebar}
            >
              <span className="sidebar__link-icon"><BuildingIcon /></span>
              <span className="sidebar__link-label">CRM</span>
            </NavLink>
          )}

          {can('employees.view') && (
            <NavLink
              to="/admin/employees"
              className={({ isActive }) => classNames('sidebar__link', isActive && 'sidebar__link--active')}
              onClick={closeMobileSidebar}
            >
              <span className="sidebar__link-icon">
                <UsersIcon />
              </span>
              <span className="sidebar__link-label">Xodimlar</span>
            </NavLink>
          )}

          {can('tasks.view') && (
            <NavLink
              to="/admin/tasks"
              className={({ isActive }) => classNames('sidebar__link', isActive && 'sidebar__link--active')}
              onClick={closeMobileSidebar}
            >
              <span className="sidebar__link-icon">
                <InboxIcon />
              </span>
              <span className="sidebar__link-label">Vazifalar</span>
            </NavLink>
          )}

          {(can('settings.view') || can('programs.view')) && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => classNames('sidebar__link', isActive && 'sidebar__link--active')}
              onClick={closeMobileSidebar}
            >
              <span className="sidebar__link-icon">
                <SettingsIcon />
              </span>
              <span className="sidebar__link-label">Sozlamalar</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__account">
            <UserMenu variant="sidebar" />
          </div>
          <button type="button" className="sidebar__collapse-btn" onClick={toggleSidebarCollapsed} aria-label="Yon panelni yig‘ish">
            <ChevronLeftIcon style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>
      </aside>

      <div
        className={classNames('sidebar-backdrop', mobileSidebarOpen && 'sidebar-backdrop--visible')}
        onClick={closeMobileSidebar}
      />
    </>
  )
}
