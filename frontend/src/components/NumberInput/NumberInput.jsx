import { Input } from '../Input/Input'

/**
 * Numeric input shared by CRM forms.
 *
 * Native number inputs change their value when the focused control receives a
 * wheel event or ArrowUp/ArrowDown. Those gestures are unsafe for money and
 * quantity fields, so they are cancelled here once for every caller.
 */
export function NumberInput({ onWheel, onKeyDown, inputMode = 'decimal', ...props }) {
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

  return <Input {...props} type="number" inputMode={inputMode} onWheel={handleWheel} onKeyDown={handleKeyDown} />
}
