import { useState } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { customerGroupsService } from '../../../services/customers.service'
import { Modal } from '../../../components/Modal/Modal'
import { Dropdown, DropdownItem } from '../../../components/Dropdown/Dropdown'
import { CustomerGroupForm } from './CustomerGroupForm'
import { classNames } from '../../../utils/classNames'
import { MoreIcon } from '../../../components/icons/Icons'
import './CustomerGroupsBar.scss'

// Papka-style tags: a customer can belong to any number of groups
// (customer.groupIds), admin manages the group list itself right here —
// no separate Settings page, this is a Mijozlar-page-local concept.
export function CustomerGroupsBar({ activeGroupId, onSelectGroup }) {
  const { data, loading, refetch } = useAsync(() => customerGroupsService.list({ pageSize: 100 }), [])
  const [editingGroup, setEditingGroup] = useState(null)
  const groupModal = useDisclosure()
  const confirm = useConfirm()
  const toast = useToast()

  const saveAction = useAction((values) =>
    editingGroup ? customerGroupsService.update(editingGroup.id, values) : customerGroupsService.create(values)
  )
  const deleteAction = useAction((id) => customerGroupsService.remove(id))

  const groups = data?.items ?? []

  const openCreate = () => {
    setEditingGroup(null)
    groupModal.open()
  }
  const openEdit = (group) => {
    setEditingGroup(group)
    groupModal.open()
  }

  const handleSave = async (values) => {
    try {
      await saveAction.run(values)
      toast.success(editingGroup ? 'Guruh yangilandi' : 'Guruh yaratildi')
      groupModal.close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Guruhni saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async (group) => {
    const ok = await confirm({
      title: 'Guruhni o‘chirish',
      description: `"${group.name}" guruhini o‘chirmoqchimisiz? Mijozlar guruhdan chiqariladi, lekin o‘chirilmaydi.`,
      confirmLabel: 'O‘chirish',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAction.run(group.id)
      toast.success('Guruh o‘chirildi')
      if (activeGroupId === group.id) onSelectGroup('')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Guruhni o‘chirishda xatolik yuz berdi')
    }
  }

  if (loading) return null

  return (
    <div className="customer-groups-bar">
      <button
        type="button"
        className={classNames('customer-groups-bar__chip', !activeGroupId && 'customer-groups-bar__chip--active')}
        onClick={() => onSelectGroup('')}
      >
        Barcha mijozlar
      </button>
      {groups.map((group) => (
        <div key={group.id} className={classNames('customer-groups-bar__chip', activeGroupId === group.id && 'customer-groups-bar__chip--active')}>
          <button type="button" className="customer-groups-bar__chip-label" onClick={() => onSelectGroup(group.id)}>
            {group.name}
          </button>
          <Dropdown
            trigger={(toggle) => (
              <button type="button" className="customer-groups-bar__chip-menu" onClick={toggle} aria-label="Guruh amallari">
                <MoreIcon width={12} height={12} />
              </button>
            )}
          >
            <DropdownItem onClick={() => openEdit(group)}>Nomini o‘zgartirish</DropdownItem>
            <DropdownItem danger onClick={() => handleDelete(group)}>
              O‘chirish
            </DropdownItem>
          </Dropdown>
        </div>
      ))}
      <button type="button" className="customer-groups-bar__add" onClick={openCreate}>
        + Guruh yaratish
      </button>

      <Modal open={groupModal.isOpen} title={editingGroup ? 'Guruhni tahrirlash' : 'Yangi guruh'} onClose={groupModal.close}>
        <CustomerGroupForm
          initialValues={editingGroup ? { name: editingGroup.name } : undefined}
          submitLabel={editingGroup ? 'Saqlash' : 'Yaratish'}
          loading={saveAction.loading}
          onSubmit={handleSave}
          onCancel={groupModal.close}
        />
      </Modal>
    </div>
  )
}
