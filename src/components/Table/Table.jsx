import { classNames } from '../../utils/classNames'
import './Table.scss'

export function Table({ columns, data, keyField = 'id', onRowClick, className }) {
  return (
    <div className="table-wrapper">
      <table className={classNames('table', onRowClick && 'table--clickable', className)}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
