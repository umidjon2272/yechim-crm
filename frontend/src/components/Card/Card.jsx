import { classNames } from '../../utils/classNames'
import './Card.scss'

export function Card({ title, actions, footer, noPadding, className, children }) {
  return (
    <div className={classNames('card', noPadding && 'card--no-padding', className)}>
      {(title || actions) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  )
}
