import { Link } from 'react-router-dom'
import { Button } from '../components/Button/Button'

export function UnauthorizedPage() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-state__title" style={{ fontSize: 48 }}>
        403
      </div>
      <div className="empty-state__title">Ruxsat yo‘q</div>
      <p className="empty-state__description">Bu sahifani ko‘rish uchun sizda yetarli ruxsat yo‘q.</p>
      <Link to="/admin">
        <Button>Bosh sahifaga qaytish</Button>
      </Link>
    </div>
  )
}
