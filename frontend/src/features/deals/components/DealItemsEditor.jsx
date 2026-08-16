import { useState } from 'react'
import { dealsService } from '../../../services/deals.service'
import { useDealItems } from '../deals.hooks'
import { useAction } from '../../../hooks/useAction'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { usePermissions } from '../../roles/usePermissions'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { Modal } from '../../../components/Modal/Modal'
import { FormField } from '../../../components/FormField/FormField'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { InboxIcon, PlusIcon } from '../../../components/icons/Icons'

const DEFAULT_ITEM = { product: '', quantity: 1, unitPrice: 0, discount: 0 }

function computeTotal(item) {
  const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0)
  return Math.max(0, subtotal - Number(item.discount || 0))
}

function ItemForm({ initialValues = DEFAULT_ITEM, loading, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues)
  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      product: values.product,
      quantity: Number(values.quantity) || 0,
      unitPrice: Number(values.unitPrice) || 0,
      discount: Number(values.discount) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Mahsulot" required>
        <Input value={values.product} onChange={handleChange('product')} disabled={loading} />
      </FormField>
      <div className="detail-grid">
        <FormField label="Miqdori">
          <Input type="number" min="1" value={values.quantity} onChange={handleChange('quantity')} disabled={loading} />
        </FormField>
        <FormField label="Narxi (birlik)">
          <Input type="number" min="0" value={values.unitPrice} onChange={handleChange('unitPrice')} disabled={loading} />
        </FormField>
      </div>
      <FormField label="Chegirma">
        <Input type="number" min="0" value={values.discount} onChange={handleChange('discount')} disabled={loading} />
      </FormField>
      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Bekor qilish
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Saqlash
        </Button>
      </div>
    </form>
  )
}

/**
 * subtotal/discount/grand total below are computed client-side purely for
 * display while editing — the backend recalculates and owns the real totals
 * once items are saved (e.g. reflected back on the Deal's `value`/summary).
 */
export function DealItemsEditor({ dealId }) {
  const { can } = usePermissions()
  const { data, loading, error, refetch } = useDealItems(dealId)
  const { isOpen, open, close } = useDisclosure()
  const [editingItem, setEditingItem] = useState(null)
  const addAction = useAction((payload) => dealsService.addItem(dealId, payload))
  const updateAction = useAction((payload) => dealsService.updateItem(dealId, editingItem.id, payload))
  const removeAction = useAction((itemId) => dealsService.removeItem(dealId, itemId))
  const confirm = useConfirm()
  const toast = useToast()

  const items = data?.items ?? data ?? []
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const grandTotal = Math.max(0, subtotal - totalDiscount)

  const openCreate = () => {
    setEditingItem(null)
    open()
  }

  const openEdit = (item) => {
    setEditingItem(item)
    open()
  }

  const handleSubmit = async (payload) => {
    try {
      if (editingItem) {
        await updateAction.run(payload)
        toast.success('Mahsulot yangilandi')
      } else {
        await addAction.run(payload)
        toast.success('Mahsulot qo‘shildi')
      }
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Saqlashda xatolik yuz berdi')
    }
  }

  const handleRemove = async (item) => {
    const ok = await confirm({ title: 'Mahsulotni o‘chirish', description: `"${item.product}" o‘chirilsinmi?`, danger: true, confirmLabel: 'O‘chirish' })
    if (!ok) return
    try {
      await removeAction.run(item.id)
      toast.success('Mahsulot o‘chirildi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'O‘chirishda xatolik yuz berdi')
    }
  }

  return (
    <Card
      title="Mahsulotlar"
      actions={
        can('deals.edit') && (
          <Button size="sm" onClick={openCreate}>
            <PlusIcon width={16} height={16} /> Qo‘shish
          </Button>
        )
      }
    >
      {loading && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Mahsulotlar qo‘shilmagan" />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Miqdori</th>
                <th>Narxi</th>
                <th>Chegirma</th>
                <th>Jami</th>
                {can('deals.edit') && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="table__cell-primary">{item.product}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice}</td>
                  <td>{item.discount || 0}</td>
                  <td>{item.total ?? computeTotal(item)}</td>
                  {can('deals.edit') && (
                    <td className="table__actions">
                      <button type="button" className="dropdown__item" style={{ width: 'auto' }} onClick={() => openEdit(item)}>
                        Tahrirlash
                      </button>
                      <button type="button" className="dropdown__item dropdown__item--danger" style={{ width: 'auto' }} onClick={() => handleRemove(item)}>
                        O‘chirish
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="deal-totals">
          <div className="deal-totals__row">
            <span>Oraliq summa</span>
            <span>{subtotal}</span>
          </div>
          <div className="deal-totals__row">
            <span>Chegirma</span>
            <span>-{totalDiscount}</span>
          </div>
          <div className="deal-totals__row deal-totals__row--grand">
            <span>Umumiy summa</span>
            <span>{grandTotal}</span>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>
            Bu summalar ko‘rsatish uchun frontendda hisoblanadi — yakuniy summa backendda tasdiqlanadi.
          </p>
        </div>
      )}

      <Modal open={isOpen} title={editingItem ? 'Mahsulotni tahrirlash' : 'Mahsulot qo‘shish'} onClose={close}>
        <ItemForm
          initialValues={editingItem || DEFAULT_ITEM}
          loading={addAction.loading || updateAction.loading}
          onSubmit={handleSubmit}
          onCancel={close}
        />
      </Modal>
    </Card>
  )
}
