import { useState } from 'react'
import { Input } from '../Input/Input'
import { EyeIcon, EyeOffIcon } from '../icons/Icons'
import './PasswordInput.scss'

export function PasswordInput({ error, className, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-group password-input">
      <Input type={visible ? 'text' : 'password'} error={error} className={className} {...rest} />
      <button
        type="button"
        className="input-group__suffix password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
      </button>
    </div>
  )
}
