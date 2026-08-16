import { useState } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { rolesService } from '../../../services/roles.service'
import { Card } from '../../../components/Card/Card'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { PermissionGate } from '../../roles/PermissionGate'
import { RoleForm } from '../components/RoleForm'
import { ROLE_LABELS } from '../../roles/permissions'
import { SettingsIcon } from '../../../components/icons/Icons'
import './UsersRolesSection.scss'

export function UsersRolesSection() {
  const { data, loading, error, refetch } = useAsync(() => rolesService.list(), [])
  const [expandedId, setExpandedId] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const roleModal = useDisclosure()
  const confirm = useConfirm()
  const toast = useToast()

  const saveAction = useAction((values) =>
    editingRole ? rolesService.update(editingRole.id, values) : rolesService.create(values)
  )
  const deleteAction = useAction((roleId) => rolesService.remove(roleId))

  const roles = data?.items ?? []

  const openCreate = () => {
    setEditingRole(null)
    roleModal.open()
  }

  const openEdit = (role) => {
    setEditingRole(role)
    roleModal.open()
  }

  const handleSave = async (values) => {
    try {
      await saveAction.run(values)
      toast.success(editingRole ? 'Rol yangilandi' : 'Rol yaratildi')
      roleModal.close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Rolni saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async (role) => {
    const ok = await confirm({
      title: 'Rolni o‘chirish',
      description: `"${ROLE_LABELS[role.name] || role.name}" rolini o‘chirmoqchimisiz? Bu amalni ortga qaytarib bo‘lmaydi.`,
      confirmLabel: 'O‘chirish',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAction.run(role.id)
      toast.success('Rol o‘chirildi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Rolni o‘chirishda xatolik yuz berdi')
    }
  }

  return (
    <div className="stack">
      <Card
        title="Rollar va ruxsatlar"
        actions={
          <PermissionGate permission="settings.edit">
            <Button size="sm" onClick={openCreate}>
              Yangi rol
            </Button>
          </PermissionGate>
        }
      >
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Har bir rol qaysi resurslarga qanday kirish huquqiga ega ekanini shu yerda boshqarasiz. Bu faqat interfeys darajasidagi
          tekshiruv — haqiqiy avtorizatsiya backendda amalga oshiriladi.
        </p>

        {error && (
          <Alert variant="danger" title="Rollarni yuklab bo‘lmadi">
            {error.message}
          </Alert>
        )}

        {loading && !error && (
          <div className="page-loading">
            <Spinner />
          </div>
        )}

        {!loading && !error && roles.length === 0 && (
          <EmptyState
            compact
            icon={<SettingsIcon width={20} height={20} />}
            title="Rollar topilmadi"
            description="Backend /roles endpointi ulanganidan so‘ng rollar shu yerda ko‘rinadi."
          />
        )}

        {!loading && !error && roles.length > 0 && (
          <div className="stack">
            {roles.map((role) => (
              <div key={role.id}>
                <div className="role-row">
                  <button
                    type="button"
                    className="settings-nav__item role-row__toggle"
                    onClick={() => setExpandedId(expandedId === role.id ? null : role.id)}
                  >
                    {ROLE_LABELS[role.name] || role.name}
                  </button>
                  <PermissionGate permission="settings.edit">
                    <div className="role-row__actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(role)}>
                        Tahrirlash
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(role)} loading={deleteAction.loading}>
                        O‘chirish
                      </Button>
                    </div>
                  </PermissionGate>
                </div>
                {expandedId === role.id && (
                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <PermissionMatrix value={role.permissions ?? []} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={roleModal.isOpen} title={editingRole ? 'Rolni tahrirlash' : 'Yangi rol yaratish'} onClose={roleModal.close}>
        <RoleForm
          initialValues={editingRole ?? undefined}
          submitLabel={editingRole ? 'Saqlash' : 'Yaratish'}
          loading={saveAction.loading}
          onSubmit={handleSave}
          onCancel={roleModal.close}
        />
      </Modal>
    </div>
  )
}
