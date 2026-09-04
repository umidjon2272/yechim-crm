import { classNames } from '../../utils/classNames'
import './Alert.scss'

const ICONS = {
  info: 'ℹ',
  success: '✓',
  warning: '!',
  danger: '✕',
}

export function Alert({ variant = 'info', title, children, className }) {
  return (
    <div className={classNames('alert', `alert--${variant}`, className)} role="alert">
      <span className="alert__icon" aria-hidden="true">
        {ICONS[variant]}
      </span>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        {children}
      </div>
    </div>
  )
}
