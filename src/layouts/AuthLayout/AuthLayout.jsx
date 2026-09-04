import { Outlet } from 'react-router-dom'
import './AuthLayout.scss'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="ambient-background">
        <div className="ambient-background__accent" />
      </div>
      <div className="auth-layout__panel">
        <div className="auth-layout__brand">
          <span className="auth-layout__logo-mark">Y</span>
          <span className="auth-layout__brand-name">YECHIM</span>
        </div>
        <div className="auth-layout__card">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
