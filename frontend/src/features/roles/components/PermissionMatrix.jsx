import { PERMISSION_SCHEMA, ALL_PERMISSIONS } from '../permissions'
import './PermissionMatrix.scss'

const ACTION_LABELS = {
  view: 'Ko‘rish',
  create: 'Qo‘shish',
  edit: 'Tahrirlash',
  delete: 'O‘chirish',
  viewAll: 'Barchasini ko‘rish',
  assign: 'Biriktirish',
  convert: 'Savdoga aylantirish',
  changeStage: 'Bosqichni o‘zgartirish',
  send: 'Yuborish',
  manage: 'Boshqarish',
}

// Columns are derived from whatever actions the schema actually declares
// (in a stable, sensible order) instead of a fixed action list, so
// resource-specific extras like `tasks.viewAll` still get a column.
const ACTION_ORDER = ['view', 'viewAll', 'create', 'edit', 'delete', 'assign', 'convert', 'changeStage', 'send', 'manage']
const ALL_ACTIONS = ACTION_ORDER.filter((action) =>
  PERMISSION_SCHEMA.some((resource) => resource.actions.includes(action))
)

/**
 * Renders resource x action checkboxes for a role or an individual
 * employee's permission overrides. `value` is the current permission array
 * (e.g. ['employees.view', 'employees.edit']); `onChange` receives the
 * updated array. Read-only when `onChange` is absent. In edit mode, a global
 * "Hammasini belgilash" toggle sits above the table and each resource row
 * gets its own row-level select-all.
 */
export function PermissionMatrix({ value = [], onChange }) {
  const readOnly = !onChange

  const isChecked = (resource, action) => value.includes(`${resource}.${action}`)

  const toggle = (resource, action) => {
    if (readOnly) return
    const key = `${resource}.${action}`
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key])
  }

  const isRowFullyChecked = (resource, actions) => actions.every((action) => isChecked(resource, action))

  const toggleRow = (resource, actions) => {
    if (readOnly) return
    const keys = actions.map((action) => `${resource}.${action}`)
    const allChecked = isRowFullyChecked(resource, actions)
    onChange(allChecked ? value.filter((v) => !keys.includes(v)) : Array.from(new Set([...value, ...keys])))
  }

  const isAllChecked = value.length > 0 && ALL_PERMISSIONS.every((key) => value.includes(key))

  const toggleAll = () => {
    if (readOnly) return
    onChange(isAllChecked ? [] : [...ALL_PERMISSIONS])
  }

  return (
    <div className="permission-matrix-wrap">
      {!readOnly && (
        <label className="permission-matrix__select-all">
          <input type="checkbox" checked={isAllChecked} onChange={toggleAll} />
          Hammasini belgilash
        </label>
      )}
      <div className="table-wrapper">
        <table className="permission-matrix">
          <thead>
            <tr>
              <th>Resurs</th>
              {ALL_ACTIONS.map((action) => (
                <th key={action}>{ACTION_LABELS[action]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_SCHEMA.map(({ resource, label, actions }) => (
              <tr key={resource}>
                <td className="permission-matrix__resource">
                  {readOnly ? (
                    label
                  ) : (
                    <label className="permission-matrix__row-select">
                      <input type="checkbox" checked={isRowFullyChecked(resource, actions)} onChange={() => toggleRow(resource, actions)} />
                      {label}
                    </label>
                  )}
                </td>
                {ALL_ACTIONS.map((action) =>
                  actions.includes(action) ? (
                    <td key={action}>
                      <input
                        type="checkbox"
                        checked={isChecked(resource, action)}
                        onChange={() => toggle(resource, action)}
                        disabled={readOnly}
                        aria-label={`${label} ${ACTION_LABELS[action]}`}
                      />
                    </td>
                  ) : (
                    <td key={action} aria-hidden="true" />
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
