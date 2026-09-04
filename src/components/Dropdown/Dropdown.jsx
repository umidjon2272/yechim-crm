import { useEffect, useRef } from 'react'
import { classNames } from '../../utils/classNames'
import { useDisclosure } from '../../hooks/useDisclosure'
import './Dropdown.scss'

export function Dropdown({ trigger, align = 'right', children }) {
  const { isOpen, close, toggle } = useDisclosure()
  const ref = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  return (
    <div className="dropdown" ref={ref}>
      {trigger(toggle, isOpen)}
      {isOpen && (
        <div className={classNames('dropdown__menu', align === 'left' && 'dropdown__menu--left')} onClick={close}>
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ danger, className, ...rest }) {
  return <button type="button" className={classNames('dropdown__item', danger && 'dropdown__item--danger', className)} {...rest} />
}

export function DropdownDivider() {
  return <div className="dropdown__divider" />
}

export function DropdownLabel({ children }) {
  return <div className="dropdown__label">{children}</div>
}
