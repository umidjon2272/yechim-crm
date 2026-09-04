import { classNames } from '../../utils/classNames'
import './Tabs.scss'

/**
 * Pure tab-strip primitive — the consuming page owns which content renders
 * per tab (same pattern SettingsPage already used before this redesign).
 * `items` is [{ id, label }].
 */
export function Tabs({ items, activeId, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeId === item.id}
          className={classNames('tabs__item', activeId === item.id && 'tabs__item--active')}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
