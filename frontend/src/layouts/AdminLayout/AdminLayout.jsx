import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import './AdminLayout.scss'

// Businesses/Quotations/Activities keep their titles even though they no
// longer have a sidebar entry — they're still reachable as detail pages
// linked from the Customer/Deal hub (CRM strukturasi, 1-bosqich).
const TITLE_MAP = [
  { prefix: '/admin/employees', title: 'Xodimlar' },
  { prefix: '/admin/settings', title: 'Sozlamalar' },
  { prefix: '/admin/profile', title: 'Profil' },
  { prefix: '/admin/my-work', title: 'Mening ishlarim' },
  { prefix: '/admin/tasks', title: 'Vazifalar' },
  { prefix: '/admin/notifications', title: 'Bildirishnomalar' },
  { prefix: '/admin/crm/customers', title: 'Mijozlar' },
  { prefix: '/admin/crm/businesses', title: 'Bizneslar' },
  { prefix: '/admin/crm/leads', title: 'Murojaatlar' },
  { prefix: '/admin/crm/deals', title: 'Savdolar' },
  { prefix: '/admin/crm/quotations', title: 'Takliflar' },
  { prefix: '/admin/crm/payments', title: 'To‘lovlar' },
  { prefix: '/admin/crm/activities', title: 'Faoliyatlar' },
  { prefix: '/admin/crm/installations', title: 'O‘rnatishlar' },
]

function resolveTitle(pathname) {
  return TITLE_MAP.find((entry) => pathname.startsWith(entry.prefix))?.title || 'YECHIM'
}

export function AdminLayout() {
  const location = useLocation()
  const hideHeader = location.pathname.startsWith('/admin/crm/customers')

  return (
    <div className="admin-layout">
      <div className="ambient-background">
        <div className="ambient-background__accent" />
      </div>
      <Sidebar />
      <div className="admin-layout__main">
        {!hideHeader && <Header title={resolveTitle(location.pathname)} />}
        {hideHeader && <Header title={resolveTitle(location.pathname)} className="header--mobile-only" />}
        <main className={`admin-layout__content page-enter${hideHeader ? ' admin-layout__content--no-header' : ''}`} key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
