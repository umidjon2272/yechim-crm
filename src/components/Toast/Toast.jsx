import { createPortal } from 'react-dom'
import { classNames } from '../../utils/classNames'
import './Toast.scss'

const ICONS = { info: 'ℹ', success: '✓', warning: '!', danger: '✕' }

export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={classNames('toast', 'alert', `alert--${toast.variant}`)} role="status">
          <span className="alert__icon" aria-hidden="true">
            {ICONS[toast.variant]}
          </span>
          <div className="alert__content">
            {toast.title && <div className="alert__title">{toast.title}</div>}
            {toast.message}
          </div>
          <button type="button" className="modal__close" onClick={() => onDismiss(toast.id)} aria-label="Yopish">
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
