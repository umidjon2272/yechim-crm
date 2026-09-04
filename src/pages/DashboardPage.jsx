import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { GlassCard } from '../components/GlassCard/GlassCard'
import { Button } from '../components/Button/Button'
import { ROLE_LABELS } from '../features/roles/permissions'
import { PermissionGate } from '../features/roles/PermissionGate'
import './DashboardPage.scss'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Xush kelibsiz, {user?.name?.split(' ')[0] || 'foydalanuvchi'}</h2>
          <p className="page-header__subtitle">
            {ROLE_LABELS[user?.role] || user?.role} sifatida YECHIM tizimiga xush kelibsiz.
          </p>
        </div>
      </div>

      <GlassCard variant="elevated" className="dashboard-welcome">
        <h3 className="dashboard-welcome__title">Savdo va operatsion ko‘rsatkichlar bir joyda</h3>
        <p className="dashboard-welcome__text text-muted">
          Mijozlar, murojaatlar, savdolar, to‘lovlar va o‘rnatishlar bo‘yicha to‘liq statistikani CRM statistikasi
          bo‘limida ko‘rishingiz mumkin. Kundalik ishlaringiz esa “Mening ishlarim” bo‘limida to‘planadi.
        </p>
        <div className="dashboard-welcome__actions">
          <PermissionGate permission="dashboard.view">
            <Link to="/admin/crm/dashboard">
              <Button>CRM statistikasini ko‘rish</Button>
            </Link>
          </PermissionGate>
          <Link to="/admin/my-work">
            <Button variant="secondary">Mening ishlarim</Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
