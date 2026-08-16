import { classNames } from '../../utils/classNames'
import './Input.scss'

export function Input({ error, className, ...rest }) {
  return <input className={classNames('input', error && 'input--error', className)} {...rest} />
}
