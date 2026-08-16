import { classNames } from '../../utils/classNames'
import './StatCard.scss'

/**
 * `trend` is optional: { direction: 'up' | 'down', label: string }. Kept
 * optional so existing call sites without trend data (most, since the mock
 * backend doesn't compute deltas yet) render unchanged.
 */
export function StatCard({ label, value, icon, variant = 'primary', trend, loading }) {
  return (
    <div className="stat-card">
      <div className={classNames('stat-card__icon', `stat-card__icon--${variant}`)}>{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value stat-value">{loading ? '—' : value}</div>
        {trend && !loading && (
          <div className={classNames('stat-card__trend', `stat-card__trend--${trend.direction}`)}>
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            {trend.label}
          </div>
        )}
      </div>
    </div>
  )
}
