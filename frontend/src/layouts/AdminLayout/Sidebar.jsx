import { NavLink, useLocation } from 'react-router-dom'
import { classNames } from '../../utils/classNames'
import { useUI } from '../../store/UIContext'
import { usePermissions } from '../../features/roles/usePermissions'
import { BuildingIcon, SettingsIcon, ChevronDownIcon, ChevronLeftIcon, InboxIcon, UsersIcon } from '../../components/icons/Icons'
import './Sidebar.scss'

// Bitrix24-style hub: everything customer-related (business, lead, deal,
// quotation, product, installation, task, call, note, file) is reached from
// the Customer detail page's tabs, not from a separate top-level module per
// entity — so the CRM submenu only lists the handful of list pages that need
// their own dedicated queue view, not every entity in the data model.
const CRM_LINKS = [
  { to: '/admin/crm/customers', label: 'Mijozlar', permission: 'customers.view' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUI()
  const { can } = usePermissions()
  const location = useLocation()

  const visibleCrmLinks = CRM_LINKS.filter((link) => !link.permission || can(link.permission))
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
          {visibleCrmLinks.length > 0 && (
            <>
              <div className={classNames('sidebar__link', crmSectionActive && 'sidebar__link--active')}>
                <span className="sidebar__link-icon">
                  <BuildingIcon />
                </span>
                <span className="sidebar__link-label">CRM</span>
                <ChevronDownIcon width={14} height={14} style={{ marginLeft: 'auto' }} />
              </div>
              <div className="sidebar__sublinks">
                {visibleCrmLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => classNames('sidebar__sublink', isActive && 'sidebar__sublink--active')}
                    onClick={closeMobileSidebar}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </>
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

          {can('settings.view') && (
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
