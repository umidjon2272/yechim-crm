import { classNames } from '../../utils/classNames'
import './Spinner.scss'

export function Spinner({ size = 'md', className }) {
  return <span className={classNames('spinner', `spinner--${size}`, className)} role="status" aria-label="Yuklanmoqda" />
}
