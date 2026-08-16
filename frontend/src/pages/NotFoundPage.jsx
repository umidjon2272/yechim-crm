import { Link } from 'react-router-dom'
import { Button } from '../components/Button/Button'

export function NotFoundPage() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-state__title" style={{ fontSize: 48 }}>
        404
      </div>
      <div className="empty-state__title">Sahifa topilmadi</div>
      <p className="empty-state__description">Siz izlayotgan sahifa mavjud emas yoki ko‘chirilgan.</p>
      <Link to="/admin">
        <Button>Bosh sahifaga qaytish</Button>
      </Link>
    </div>
  )
}
