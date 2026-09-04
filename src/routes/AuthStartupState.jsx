import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { Spinner } from '../components/Spinner/Spinner'

export function AuthStartupState() {
  const { isChecking, isStartupError, startupStartedAt, refreshUser } = useAuth()
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (!isChecking || !startupStartedAt) {
      setElapsedMs(0)
      return undefined
    }

    const updateElapsed = () => setElapsedMs(Date.now() - startupStartedAt)
    updateElapsed()
    const timer = window.setInterval(updateElapsed, 250)
    return () => window.clearInterval(timer)
  }, [isChecking, startupStartedAt])

  if (!isChecking && !isStartupError) return null
  if (isChecking && elapsedMs < 2500) return <div className="full-page-loading"><Spinner size="lg" /></div>

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  const title = isStartupError
    ? "Serverga ulanib bo'lmaydi"
    : offline
      ? "Internet aloqasi yo'q"
      : elapsedMs >= 10000
        ? 'Server ishga tushmoqda...'
        : "Server uyg'onmoqda..."
  const description = isStartupError
    ? 'Avtomatik urinishlar tugadi. Sessiyani qayta tekshirish mumkin.'
    : offline
      ? 'Internetni tekshirish davom etmoqda.'
      : elapsedMs >= 10000
        ? 'Bu odatda bir necha soniya oladi.'
        : 'Sessiya fonda tekshirilmoqda.'

  return (
    <div className="full-page-loading startup-state">
      <div className="startup-state__card">
        <strong>{title}</strong>
        <p>{description}</p>
        {isStartupError && (
          <button type="button" className="btn btn--secondary" onClick={() => refreshUser({ force: true })}>
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  )
}
