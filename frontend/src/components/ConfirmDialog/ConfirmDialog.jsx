import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'

export function ConfirmDialog({
  open,
  title = 'Tasdiqlash',
  description,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor qilish',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      danger={danger}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {typeof description === 'string' ? <p className="text-muted">{description}</p> : description}
    </Modal>
  )
}
