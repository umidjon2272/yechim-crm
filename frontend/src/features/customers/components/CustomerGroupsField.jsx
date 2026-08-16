import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { customerGroupsService, customersService } from '../../../services/customers.service'
import { useToast } from '../../../store/ToastContext'
import { classNames } from '../../../utils/classNames'
import './CustomerGroupsBar.scss'

// A customer can belong to any number of groups (papka-style tags) — toggled
// directly here rather than via a separate picker modal, since the group
// list is usually short (a handful of admin-defined tags).
export function CustomerGroupsField({ customer, onChanged }) {
  const { data } = useAsync(() => customerGroupsService.list({ pageSize: 100 }), [])
  const groups = data?.items ?? []
  const toast = useToast()

  const toggleAction = useAction((nextGroupIds) => customersService.setGroups(customer.id, nextGroupIds))

  const memberIds = customer.groupIds || []

  const handleToggle = async (groupId) => {
    const next = memberIds.includes(groupId) ? memberIds.filter((id) => id !== groupId) : [...memberIds, groupId]
    try {
      await toggleAction.run(next)
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Guruhni yangilashda xatolik yuz berdi')
    }
  }

  if (groups.length === 0) return <span className="text-muted">—</span>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          disabled={toggleAction.loading}
          onClick={() => handleToggle(group.id)}
          className={classNames('customer-groups-bar__chip', memberIds.includes(group.id) && 'customer-groups-bar__chip--active')}
          style={{ cursor: 'pointer' }}
        >
          <span className="customer-groups-bar__chip-label">{group.name}</span>
        </button>
      ))}
    </div>
  )
}
