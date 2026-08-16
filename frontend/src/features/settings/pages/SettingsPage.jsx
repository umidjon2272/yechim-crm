import { useState } from 'react'
import { classNames } from '../../../utils/classNames'
import { GeneralSection } from '../sections/GeneralSection'
import { UsersRolesSection } from '../sections/UsersRolesSection'
import { EmployeesSection } from '../sections/EmployeesSection'
import { ProgramCatalogSection } from '../sections/ProgramCatalogSection'
import { CustomerFieldsSection } from '../sections/CustomerFieldsSection'
import { ProfilePage } from '../../profile/pages/ProfilePage'
import './SettingsPage.scss'

// Registry pattern: adding a section later is just one more entry here plus
// its section component — no routing changes needed. Jamoalar (Teams) is
// deliberately not a section here — BOLD YECHIM CRM strukturasi treats
// teams as an internal employee-assignment detail, not a module of its
// own; the underlying feature/route still exists, just unlisted.
const SECTIONS = [
  { id: 'profile', label: 'Profil', Component: ProfilePage },
  { id: 'employees', label: 'Xodimlar', Component: EmployeesSection },
  { id: 'users-roles', label: 'Rollar va ruxsatlar', Component: UsersRolesSection },
  { id: 'programs', label: 'Dasturlar', Component: ProgramCatalogSection },
  { id: 'customer-fields', label: 'Mijoz maydonlari', Component: CustomerFieldsSection },
  // "Umumiy sozlamalar" (kompaniya nomi, vaqt mintaqasi) = CRM sozlamalari.
  { id: 'general', label: 'CRM sozlamalari', Component: GeneralSection },
]

export function SettingsPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const ActiveComponent = SECTIONS.find((s) => s.id === activeId)?.Component

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
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={classNames('settings-nav__item', activeId === section.id && 'settings-nav__item--active')}
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
