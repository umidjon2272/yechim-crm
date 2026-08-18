import { useState } from 'react'
import { classNames } from '../../../utils/classNames'
import { UsersRolesSection } from '../sections/UsersRolesSection'
import { EmployeesSection } from '../sections/EmployeesSection'
import { ProgramCatalogSection } from '../sections/ProgramCatalogSection'
import { ProfilePage } from '../../profile/pages/ProfilePage'
import { usePermissions } from '../../roles/usePermissions'
import './SettingsPage.scss'

const SECTIONS = [
  { id: 'profile', label: 'Profil', Component: ProfilePage },
  { id: 'employees', label: 'Xodimlar', Component: EmployeesSection },
  { id: 'permissions', label: 'Ruxsatlar', Component: UsersRolesSection },
  { id: 'programs', label: 'Dasturlar', Component: ProgramCatalogSection },
]

export function SettingsPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const { can } = usePermissions()
  const visibleSections = SECTIONS.filter((section) => {
    if (section.id === 'profile') return true
    if (section.id === 'employees') return can('employees.view')
    if (section.id === 'permissions') return can('settings.view')
    if (section.id === 'programs') return can('programs.view')
    return false
  })
  const safeActiveId = visibleSections.some((section) => section.id === activeId) ? activeId : visibleSections[0]?.id
  const ActiveComponent = visibleSections.find((section) => section.id === safeActiveId)?.Component

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Sozlamalar</h2>
          <p className="page-header__subtitle">Tizim sozlamalari</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={classNames('settings-nav__item', safeActiveId === section.id && 'settings-nav__item--active')}
              onClick={() => setActiveId(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="settings-content">{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  )
}
