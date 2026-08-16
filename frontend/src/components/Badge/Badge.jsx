import { classNames } from '../../utils/classNames'
import './Badge.scss'

export function Badge({ variant = 'gray', dot = true, className, children }) {
  return <span className={classNames('badge', `badge--${variant}`, !dot && 'badge--no-dot', className)}>{children}</span>
}
