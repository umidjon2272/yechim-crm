import { classNames } from '../../utils/classNames'
import './Avatar.scss'

function getInitials(name = '') {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return initials || '?'
}

export function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={classNames('avatar', `avatar--${size}`, className)} />
  }

  return (
    <span className={classNames('avatar', 'avatar--fallback', `avatar--${size}`, className)} aria-hidden="true">
      {getInitials(name)}
    </span>
  )
}
