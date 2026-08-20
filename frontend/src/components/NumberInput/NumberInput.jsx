import { Input } from '../Input/Input'

/**
 * Keep a numeric-looking value while avoiding the browser's native number
 * control. Native number inputs can change their value on wheel/arrow events
 * even when the application does not want a stepper control.
 */
export function parseNumericInput(value) {
  const raw = String(value ?? '').replace(',', '.')
  const hasNegativeSign = raw.trimStart().startsWith('-')
  const hasDecimalSeparator = raw.includes('.')
  const digitsOnly = raw.replace(/[^\d.]/g, '')
  const separatorIndex = digitsOnly.indexOf('.')
  const integerPart = (separatorIndex === -1 ? digitsOnly : digitsOnly.slice(0, separatorIndex)) || (hasDecimalSeparator ? '0' : '')
  const decimalPart = separatorIndex === -1 ? '' : digitsOnly.slice(separatorIndex + 1).replace(/\./g, '')

  if (!integerPart && !decimalPart) return hasNegativeSign ? '-' : ''
  return `${hasNegativeSign ? '-' : ''}${integerPart}${hasDecimalSeparator ? `.${decimalPart}` : ''}`
}

/**
 * Numeric input shared by CRM forms.
 *
 * `inputMode` keeps the numeric keyboard on mobile. The parser accepts typed
 * digits and one decimal separator while removing accidental formatting or
 * letters. It deliberately leaves range validation to the form/backend.
 */
export function NumberInput({ onChange, onWheel, onKeyDown, inputMode = 'decimal', ...props }) {
  const handleChange = (event) => {
    const parsedValue = parseNumericInput(event.target.value)
    // The event target is the actual text input. Updating its value before
    // forwarding the event keeps existing form handlers compatible with the
    // normal `event.target.value` contract.
    if (event.target.value !== parsedValue) event.target.value = parsedValue
    onChange?.(event)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onWheel?.(event)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onKeyDown?.(event)
  }

  return <Input {...props} type="text" inputMode={inputMode} onChange={handleChange} onWheel={handleWheel} onKeyDown={handleKeyDown} />
}
