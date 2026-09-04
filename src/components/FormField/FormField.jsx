import { classNames } from '../../utils/classNames'
import './FormField.scss'

let fieldIdCounter = 0

export function FormField({ label, htmlFor, required, hint, error, children }) {
  const id = htmlFor || (children?.props?.id ?? `field-${++fieldIdCounter}`)

  return (
    <div className={classNames('form-field', error && 'form-field--invalid')}>
      {label && (
        <label className="form-field__label" htmlFor={id}>
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      {children}
      {error ? <span className="form-field__error">{error}</span> : hint ? <span className="form-field__hint">{hint}</span> : null}
    </div>
  )
}
