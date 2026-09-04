import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { BUSINESS_STATUSES, BUSINESS_STATUS_LABELS } from '../businesses.constants'

const DEFAULT_VALUES = {
  name: '',
  businessType: '',
  customerId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  status: 'active',
  assignedEmployeeId: '',
  notes: '',
}

export function BusinessForm({ initialValues = DEFAULT_VALUES, customers = [], employees = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [rules.required('Biznes nomi kiritilishi shart')],
      customerId: [rules.required('Mijoz tanlanishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Biznes nomi" required error={errors.name}>
        <Input value={values.name} onChange={handleChange('name')} error={!!errors.name} disabled={loading} />
      </FormField>

      <FormField label="Biznes turi" hint="Masalan: restoran, do‘kon, apteka">
        <Input value={values.businessType} onChange={handleChange('businessType')} disabled={loading} />
      </FormField>

      <FormField label="Mijoz (egasi)" required error={errors.customerId}>
        <Select value={values.customerId} onChange={handleChange('customerId')} disabled={loading}>
          <option value="">Tanlanmagan</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="detail-grid">
        <FormField label="Telefon">
          <Input value={values.phone} onChange={handleChange('phone')} disabled={loading} />
        </FormField>
        <FormField label="Elektron pochta">
          <Input type="email" value={values.email} onChange={handleChange('email')} disabled={loading} />
        </FormField>
      </div>

      <div className="detail-grid">
        <FormField label="Manzil">
          <Input value={values.address} onChange={handleChange('address')} disabled={loading} />
        </FormField>
        <FormField label="Shahar">
          <Input value={values.city} onChange={handleChange('city')} disabled={loading} />
        </FormField>
      </div>

      <FormField label="Mas'ul xodim">
        <Select value={values.assignedEmployeeId} onChange={handleChange('assignedEmployeeId')} disabled={loading}>
          <option value="">Tanlanmagan</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Holat">
        <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
          {BUSINESS_STATUSES.map((status) => (
            <option key={status} value={status}>
              {BUSINESS_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
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
