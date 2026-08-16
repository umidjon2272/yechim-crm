import { useState } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { programCatalogService } from '../../../services/customers.service'
import { Card } from '../../../components/Card/Card'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Button } from '../../../components/Button/Button'
import { Modal } from '../../../components/Modal/Modal'
import { ProgramCatalogForm } from '../components/ProgramCatalogForm'
import { InboxIcon } from '../../../components/icons/Icons'

// Admin-defined product catalog (Sozlamalar -> Dasturlar) — a customer's
// "+ Dastur qo'shish" select reads directly from this list, so a new
// program shows up everywhere the moment it's saved here, no redeploy.
export function ProgramCatalogSection() {
  const { data, loading, error, refetch } = useAsync(() => programCatalogService.list({ pageSize: 100 }), [])
  const [editingProgram, setEditingProgram] = useState(null)
  const programModal = useDisclosure()
  const confirm = useConfirm()
  const toast = useToast()

  const saveAction = useAction((values) =>
    editingProgram ? programCatalogService.update(editingProgram.id, values) : programCatalogService.create(values)
  )
  const deleteAction = useAction((id) => programCatalogService.remove(id))

  const programs = data?.items ?? []

  const openCreate = () => {
    setEditingProgram(null)
    programModal.open()
  }
  const openEdit = (program) => {
    setEditingProgram(program)
    programModal.open()
  }

  const handleSave = async (values) => {
    try {
      await saveAction.run(values)
      toast.success(editingProgram ? 'Dastur yangilandi' : 'Dastur yaratildi')
      programModal.close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Dasturni saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async (program) => {
    const ok = await confirm({
      title: 'Dasturni o‘chirish',
      description: `"${program.name}" dasturini katalogdan o‘chirmoqchimisiz? Mijozlarga allaqachon qo‘shilgan nusxalari o‘zgarishsiz qoladi.`,
      confirmLabel: 'O‘chirish',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAction.run(program.id)
      toast.success('Dastur o‘chirildi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Dasturni o‘chirishda xatolik yuz berdi')
    }
  }

  return (
    <>
      <Card
        title="Dasturlar"
        actions={
          <Button size="sm" onClick={openCreate}>
            + Dastur
          </Button>
        }
      >
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Bu yerda yaratilgan dasturlar mijoz oynasidagi "+ Dastur qo‘shish" ro‘yxatida avtomatik chiqadi.
        </p>

        {error && (
          <Alert variant="danger" title="Dasturlarni yuklab bo‘lmadi">
            {error.message}
          </Alert>
        )}
        {loading && !error && (
          <div className="page-loading">
            <Spinner />
          </div>
        )}
        {!loading && !error && programs.length === 0 && (
          <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Hali dastur yaratilmagan" />
        )}
        {!loading && !error && programs.length > 0 && (
          <div className="stack">
            {programs.map((program) => (
              <div key={program.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {program.name}
                  {program.type && <span className="text-muted text-xs" style={{ marginLeft: 8 }}>{program.type}</span>}
                  {program.version && <span className="text-muted text-xs" style={{ marginLeft: 8 }}>v{program.version}</span>}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(program)}>
                    Tahrirlash
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(program)} loading={deleteAction.loading}>
                    O‘chirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={programModal.isOpen} title={editingProgram ? 'Dasturni tahrirlash' : 'Yangi dastur'} onClose={programModal.close}>
        <ProgramCatalogForm
          initialValues={editingProgram ?? undefined}
          submitLabel={editingProgram ? 'Saqlash' : 'Yaratish'}
          loading={saveAction.loading}
          onSubmit={handleSave}
          onCancel={programModal.close}
        />
      </Modal>
    </>
  )
}
