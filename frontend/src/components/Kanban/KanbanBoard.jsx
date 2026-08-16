import { useState } from 'react'
import './KanbanBoard.scss'

/**
 * Generic Kanban board using native HTML5 drag-and-drop — no DnD library
 * dependency. `columns` is [{id,label}], `items` is any list, `getColumnId`
 * maps an item to its column id, `renderCard` renders one card,
 * `renderColumnHeader(column, columnItems)` can replace the default header,
 * `renderColumnAction(column, columnItems)` renders controls below the header,
 * `onCardMove(item, fromColumnId, toColumnId)` fires on drop.
 */
export function KanbanBoard({
  columns,
  items,
  getColumnId,
  renderCard,
  renderColumnHeader,
  renderColumnAction,
  renderColumnFooter,
  renderColumnGap,
  afterColumns,
  onCardMove,
}) {
  const [dragItemId, setDragItemId] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const itemsByColumn = columns.reduce((acc, column) => {
    acc[column.id] = items.filter((item) => getColumnId(item) === column.id)
    return acc
  }, {})

  const handleDrop = (columnId) => {
    const item = items.find((i) => String(i.id) === String(dragItemId))
    setDragOverColumn(null)
    setDragItemId(null)
    if (!item) return
    const fromColumnId = getColumnId(item)
    if (fromColumnId === columnId) return
    onCardMove?.(item, fromColumnId, columnId)
  }

  return (
    <div className="kanban">
      {columns.map((column, index) => (
        <div className="kanban__column-wrap" key={column.id}>
          <div
            className={`kanban__column kanban__column--accent-${index % 5}${dragOverColumn === column.id ? ' kanban__column--drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverColumn(column.id)
            }}
            onDragLeave={() => setDragOverColumn((current) => (current === column.id ? null : current))}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(column.id)
            }}
          >
            <div className="kanban__column-header">
              {renderColumnHeader ? (
                renderColumnHeader(column, itemsByColumn[column.id] ?? [], index)
              ) : (
                <div className="kanban__column-header-default">
                  <span>{column.label}</span>
                  <span className="kanban__count">{itemsByColumn[column.id]?.length ?? 0}</span>
                </div>
              )}
            </div>
            {renderColumnAction && <div className="kanban__column-action">{renderColumnAction(column, itemsByColumn[column.id] ?? [])}</div>}
            <div className="kanban__cards">
              {itemsByColumn[column.id]?.map((item) => (
                <div
                  key={item.id}
                  className="kanban__card"
                  draggable
                  onDragStart={() => setDragItemId(item.id)}
                  onDragEnd={() => {
                    setDragItemId(null)
                    setDragOverColumn(null)
                  }}
                >
                  {renderCard(item)}
                </div>
              ))}
            </div>
            {renderColumnFooter && <div className="kanban__column-footer">{renderColumnFooter(column, itemsByColumn[column.id] ?? [])}</div>}
          </div>
          {index < columns.length - 1 && renderColumnGap?.(column, columns[index + 1], index)}
        </div>
      ))}
      {afterColumns}
    </div>
  )
}
