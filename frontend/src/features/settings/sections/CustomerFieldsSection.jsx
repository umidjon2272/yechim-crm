import { useState } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { customerFieldDefsService } from '../../../services/customers.service'
import { Card } from '../../../components/Card/Card'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { CustomerFieldForm } from '../components/CustomerFieldForm'
import { CUSTOM_FIELD_TYPE_LABELS } from '../../customers/customers.constants'
import { SettingsIcon } from '../../../components/icons/Icons'

// Admin-defined fields render dynamically inside the customer create/edit
// form's "Qo'shimcha ma'lumotlar" section (see CustomerForm.jsx), values are
// stored per-customer under customer.customFields[fieldDefId] — nothing here
// needs a schema migration when a field is added, edited or removed later.
export function CustomerFieldsSection() {
  const { data, loading, error, refetch } = useAsync(() => customerFieldDefsService.list(), [])
  const [editingField, setEditingField] = useState(null)
  const fieldModal = useDisclosure()
  const confirm = useConfirm()
  const toast = useToast()

  const saveAction = useAction((values) =>
    editingField ? customerFieldDefsService.update(editingField.id, values) : customerFieldDefsService.create(values)
  )
  const deleteAction = useAction((id) => customerFieldDefsService.remove(id))

  const fields = data?.items ?? []

  const openCreate = () => {
    setEditingField(null)
    fieldModal.open()
  }
  const openEdit = (field) => {
    setEditingField(field)
    fieldModal.open()
  }

  const handleSave = async (values) => {
    try {
      await saveAction.run(values)
      toast.success(editingField ? 'Maydon yangilandi' : 'Maydon yaratildi')
      fieldModal.close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Maydonni saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async (field) => {
    const ok = await confirm({
      title: 'Maydonni o‘chirish',
      description: `"${field.label}" maydonini o‘chirmoqchimisiz?`,
      confirmLabel: 'O‘chirish',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAction.run(field.id)
      toast.success('Maydon o‘chirildi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Maydonni o‘chirishda xatolik yuz berdi')
    }
  }

  return (
    <>
      <Card
        title="Mijoz maydonlari"
        actions={
          <Button size="sm" onClick={openCreate}>
            + Maydon qo‘shish
          </Button>
        }
      >
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Bu yerda yaratilgan maydonlar mijoz qo‘shish formasining "Qo‘shimcha ma'lumotlar" bo‘limida avtomatik paydo bo‘ladi.
        </p>

        {error && (
          <Alert variant="danger" title="Maydonlarni yuklab bo‘lmadi">
            {error.message}
          </Alert>
        )}
        {loading && !error && (
          <div className="page-loading">
            <Spinner />
          </div>
        )}
        {!loading && !error && fields.length === 0 && (
          <EmptyState compact icon={<SettingsIcon width={20} height={20} />} title="Hali custom maydon yo‘q" />
        )}
        {!loading && !error && fields.length > 0 && (
          <div className="stack">
            {fields.map((field) => (
              <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {field.label}
                  <span className="text-muted text-xs" style={{ marginLeft: 8 }}>
                    {CUSTOM_FIELD_TYPE_LABELS[field.type] || field.type}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(field)}>
                    Tahrirlash
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(field)} loading={deleteAction.loading}>
                    O‘chirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={fieldModal.isOpen} title={editingField ? 'Maydonni tahrirlash' : 'Yangi maydon'} onClose={fieldModal.close}>
        <CustomerFieldForm
          initialValues={editingField ?? undefined}
          submitLabel={editingField ? 'Saqlash' : 'Yaratish'}
          loading={saveAction.loading}
          onSubmit={handleSave}
          onCancel={fieldModal.close}
        />
      </Modal>
    </>
  )
}
