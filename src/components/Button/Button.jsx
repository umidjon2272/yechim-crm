import { classNames } from '../../utils/classNames'
import { Spinner } from '../Spinner/Spinner'
import './Button.scss'

export function Button({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={classNames('btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size="sm" className="btn__spinner" />}
      {children}
    </button>
  )
}
