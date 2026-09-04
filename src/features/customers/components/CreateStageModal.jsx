import { useEffect, useState } from 'react'
import { Button } from '../../../components/Button/Button'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Modal } from '../../../components/Modal/Modal'

export function CreateStageModal({ open, title = 'Bosqich yaratish', initialName = '', loading, onClose, onSubmit }) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Bekor qilish
          </Button>
          <Button type="submit" form="create-customer-stage-form" loading={loading} disabled={!name.trim()}>
            Yaratish
          </Button>
        </>
      }
    >
      <form id="create-customer-stage-form" onSubmit={handleSubmit}>
        <FormField label="Bosqich nomi" htmlFor="customer-stage-name">
          <Input id="customer-stage-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus disabled={loading} />
        </FormField>
      </form>
    </Modal>
  )
}
