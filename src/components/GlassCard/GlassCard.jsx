import { classNames } from '../../utils/classNames'
import './GlassCard.scss'

/**
 * Canonical premium panel primitive — true translucent blur glass (tier 1
 * of the surface system, see abstracts/_mixins.scss). Reserved for a few
 * large "chrome" surfaces (Sidebar, Header, Modal, login card, KPI cards) —
 * not meant to be repeated densely (see `surface-card` / `Card` for that).
 */
export function GlassCard({ variant = 'default', interactive = false, className, children, ...rest }) {
  return (
    <div className={classNames('glass-card', `glass-card--${variant}`, interactive && 'glass-card--interactive', className)} {...rest}>
      <div className="glass-card__content">{children}</div>
    </div>
  )
}
