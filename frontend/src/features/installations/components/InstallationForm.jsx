import { useEffect, useState } from 'react'
import { dealsService } from '../../../services/deals.service'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { INSTALLATION_STATUSES, INSTALLATION_STATUS_LABELS } from '../installations.constants'

const DEFAULT_VALUES = {
  dealId: '',
  dealItemId: '',
  assignedEmployeeId: '',
  address: '',
  scheduledDate: '',
  status: 'PENDING',
  notes: '',
}

/**
 * `dealItemId` (not just `dealId`) lets a single deal with multiple products
 * have a separate installation record per product.
 */
export function InstallationForm({ initialValues = DEFAULT_VALUES, deals = [], employees = [], lockDeal = false, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [dealItems, setDealItems] = useState([])

  useEffect(() => {
    if (!values.dealId) {
      setDealItems([])
      return
    }
    dealsService
      .listItems(values.dealId)
      .then((res) => setDealItems(res?.items ?? res ?? []))
      .catch(() => setDealItems([]))
  }, [values.dealId])

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      dealId: [rules.required('Savdo tanlanishi shart')],
      address: [rules.required('Manzil kiritilishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Savdo" required error={errors.dealId}>
        <Select value={values.dealId} onChange={handleChange('dealId')} disabled={loading || lockDeal}>
          <option value="">Tanlanmagan</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Mahsulot" hint="Bitta dealda bir nechta mahsulot bo‘lsa, aynan qaysi biri o‘rnatilishini tanlang">
        <Select value={values.dealItemId} onChange={handleChange('dealItemId')} disabled={loading || dealItems.length === 0}>
          <option value="">Tanlanmagan</option>
          {dealItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.product} × {item.quantity}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Mas'ul xodim">
        <Select value={values.assignedEmployeeId} onChange={handleChange('assignedEmployeeId')} disabled={loading}>
          <option value="">Tanlanmagan</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="O‘rnatish manzili" required error={errors.address}>
        <Input value={values.address} onChange={handleChange('address')} error={!!errors.address} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Rejalashtirilgan sana">
          <Input type="date" value={values.scheduledDate} onChange={handleChange('scheduledDate')} disabled={loading} />
        </FormField>
        <FormField label="Holat">
          <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
            {INSTALLATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {INSTALLATION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Izohlar">
        <textarea className="textarea" rows={2} value={values.notes} onChange={handleChange('notes')} disabled={loading} />
      </FormField>

      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Bekor qilish
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
