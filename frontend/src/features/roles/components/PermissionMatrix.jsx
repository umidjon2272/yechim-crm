import { Fragment } from 'react'
import { PERMISSION_SCHEMA, ALL_PERMISSIONS } from '../permissions'
import './PermissionMatrix.scss'

const ACTION_LABELS = {
  view: "Ko'rish",
  create: "Qo'shish",
  edit: 'Tahrirlash',
  editCore: "Asosiy ma'lumotlarni tahrirlash",
  delete: "O'chirish",
  viewAll: "Barchasini ko'rish",
  viewPhone: "Telefonni ko'rish",
  viewAmount: "Savdo summasini ko'rish",
  viewPipelineTotal: "Voronka jami summasini ko'rish",
  viewDeposit: "Zaklad summasini ko'rish",
  viewFinancials: "Moliyaviy ma'lumotlarni ko'rish",
  viewCreatedBy: "Kim qo'shganini ko'rish",
  convert: "Aylantirish",
  changeStage: "Bosqichni o'zgartirish",
}

const ACTION_ORDER = ['view', 'viewAll', 'create', 'edit', 'editCore', 'viewPhone', 'viewAmount', 'viewPipelineTotal', 'viewDeposit', 'viewFinancials', 'viewCreatedBy', 'changeStage', 'convert', 'delete']
const ALL_ACTIONS = ACTION_ORDER.filter((action) => PERMISSION_SCHEMA.some((resource) => resource.actions.includes(action)))

export function PermissionMatrix({ value = [], onChange }) {
  const readOnly = !onChange
  const isChecked = (resource, action) => value.includes(`${resource}.${action}`)

  const toggle = (resource, action) => {
    if (readOnly) return
    const key = `${resource}.${action}`
    const financialKeys = ['customers.viewFinancials', 'customers.viewAmount', 'customers.viewDeposit', 'customers.viewPipelineTotal']
    if (key === 'customers.viewFinancials') {
      onChange(value.includes(key) ? value.filter((item) => !financialKeys.includes(item)) : Array.from(new Set([...value, ...financialKeys])))
      return
    }
    onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key])
  }

  const toggleRow = (resource, actions) => {
    if (readOnly) return
    const keys = actions.map((action) => `${resource}.${action}`)
    const allChecked = keys.every((key) => value.includes(key))
    onChange(allChecked ? value.filter((item) => !keys.includes(item)) : Array.from(new Set([...value, ...keys])))
  }

  const isAllChecked = value.length > 0 && ALL_PERMISSIONS.every((key) => value.includes(key))
  let lastSection = null

  return (
    <div className="permission-matrix-wrap">
      {!readOnly && (
        <label className="permission-matrix__select-all">
          <input type="checkbox" checked={isAllChecked} onChange={() => onChange(isAllChecked ? [] : [...ALL_PERMISSIONS])} />
          Hammasini belgilash
        </label>
      )}
      <div className="table-wrapper">
        <table className="permission-matrix">
          <thead>
            <tr>
              <th>Bo'lim / ruxsat</th>
              {ALL_ACTIONS.map((action) => <th key={action}>{ACTION_LABELS[action]}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_SCHEMA.map(({ resource, label, actions, section }) => {
              const showSection = section !== lastSection
              lastSection = section
              return (
                <Fragment key={resource}>
                  {showSection && <tr key={`${section}-heading`} className="permission-matrix__section"><td colSpan={ALL_ACTIONS.length + 1}>{section}</td></tr>}
                  <tr>
                    <td className="permission-matrix__resource">
                      {readOnly ? label : (
                        <label className="permission-matrix__row-select">
                          <input type="checkbox" checked={actions.every((action) => isChecked(resource, action))} onChange={() => toggleRow(resource, actions)} />
                          {label}
                        </label>
                      )}
                    </td>
                    {ALL_ACTIONS.map((action) => actions.includes(action) ? (
                      <td key={action}>
                        <input type="checkbox" checked={isChecked(resource, action)} onChange={() => toggle(resource, action)} disabled={readOnly} aria-label={`${label} ${ACTION_LABELS[action]}`} />
                      </td>
                    ) : <td key={action} aria-hidden="true" />)}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
