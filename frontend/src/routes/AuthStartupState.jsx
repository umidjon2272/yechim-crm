import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { Spinner } from '../components/Spinner/Spinner'

export function AuthStartupState() {
  const { isChecking, isStartupError, authError, refreshUser } = useAuth()
  const [slow, setSlow] = useState(Boolean(authError))

  useEffect(() => {
    if (!isChecking) return undefined
    setSlow(Boolean(authError))
    const timer = window.setTimeout(() => setSlow(true), 2500)
    return () => window.clearTimeout(timer)
  }, [isChecking, authError])

  if (!isChecking && !isStartupError) return null
  if (!slow) return <div className="full-page-loading"><Spinner size="lg" /></div>

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return (
    <div className="full-page-loading startup-state">
      <div className="startup-state__card">
        <strong>{offline ? 'Internet aloqasi yo‘q' : authError ? 'Server bilan ulanish imkoni bo‘lmadi' : 'Server uyg‘onmoqda...'}</strong>
        <p>{offline ? 'Internetni tekshiring va qayta urinib ko‘ring.' : authError ? 'Avtomatik urinishlar tugadi. Sessiyani qayta tekshirish mumkin.' : 'Sessiya fonda tekshirilmoqda.'}</p>
        <button type="button" className="btn btn--secondary" onClick={() => { setSlow(false); refreshUser() }}>Qayta urinish</button>
      </div>
    </div>
  )
}
