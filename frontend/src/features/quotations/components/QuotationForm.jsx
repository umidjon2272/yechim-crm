import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'

const DEFAULT_VALUES = { dealId: '', validUntil: '', notes: '' }

/**
 * Quotations are generated from a Deal — customer/business/products/prices
 * all come from the linked deal's items, so the form only needs the deal
 * link plus validity/notes. The backend derives the rest when creating it.
 */
export function QuotationForm({ initialValues = DEFAULT_VALUES, deals = [], lockDeal = false, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      dealId: [rules.required('Savdo tanlanishi shart')],
      validUntil: [rules.required('Amal qilish muddati kiritilishi shart')],
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

      <FormField label="Amal qilish muddati" required error={errors.validUntil}>
        <Input type="date" value={values.validUntil} onChange={handleChange('validUntil')} error={!!errors.validUntil} disabled={loading} />
      </FormField>

      <FormField label="Izohlar">
        <textarea className="textarea" rows={3} value={values.notes} onChange={handleChange('notes')} disabled={loading} />
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
