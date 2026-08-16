import { classNames } from '../../utils/classNames'
import './EmptyState.scss'

export function EmptyState({ icon, title, description, action, compact }) {
  return (
    <div className={classNames('empty-state', compact && 'empty-state--compact')}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      {title && <div className="empty-state__title">{title}</div>}
      {description && <div className="empty-state__description">{description}</div>}
      {action}
    </div>
  )
}
