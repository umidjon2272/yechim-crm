import { classNames } from '../../utils/classNames'
import './Select.scss'

export function Select({ className, children, ...rest }) {
  return (
    <select className={classNames('select', className)} {...rest}>
      {children}
    </select>
  )
}
