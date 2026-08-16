import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'

/**
 * Customer/Business are inherited from the lead and shown read-only — the
 * point of "Convert to Deal" is exactly that it does NOT re-create them.
 */
export function ConvertToDealForm({ lead, employees = [], loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: lead.title || '',
    productsNote: lead.interestedProduct || '',
    expectedValue: lead.expectedValue ?? '',
    assignedEmployeeId: lead.assignedEmployee?.id || '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [rules.required('Savdo nomi kiritilishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({
      name: values.name,
      customerId: lead.customer?.id,
      businessId: lead.business?.id,
      productsNote: values.productsNote,
      value: values.expectedValue === '' ? undefined : Number(values.expectedValue),
      salesEmployeeId: values.assignedEmployeeId || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Savdo nomi" required error={errors.name}>
        <Input value={values.name} onChange={handleChange('name')} error={!!errors.name} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Mijoz" hint="Leaddan meros — o‘zgartirilmaydi">
          <Input value={lead.customer?.name || '—'} disabled />
        </FormField>
        <FormField label="Biznes" hint="Leaddan meros — o‘zgartirilmaydi">
          <Input value={lead.business?.name || '—'} disabled />
        </FormField>
      </div>

      <FormField label="Mahsulotlar" hint="Aniq mahsulotlar deal yaratilgach Deal Items bo‘limida qo‘shiladi">
        <textarea className="textarea" rows={2} value={values.productsNote} onChange={handleChange('productsNote')} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Kutilayotgan summa">
          <Input type="number" min="0" value={values.expectedValue} onChange={handleChange('expectedValue')} disabled={loading} />
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
      </div>

      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Bekor qilish
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Savdoga aylantirish
        </Button>
      </div>
    </form>
  )
}
