import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { DEAL_STAGES, DEAL_STAGE_LABELS } from '../deals.constants'

const DEFAULT_VALUES = {
  name: '',
  customerId: '',
  businessId: '',
  salesEmployeeId: '',
  stage: 'NEW',
  value: '',
  expectedCloseDate: '',
}

export function DealForm({ initialValues = DEFAULT_VALUES, customers = [], businesses = [], employees = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [rules.required('Savdo nomi kiritilishi shart')],
      customerId: [rules.required('Mijoz tanlanishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Savdo nomi" required error={errors.name}>
        <Input value={values.name} onChange={handleChange('name')} error={!!errors.name} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Mijoz" required error={errors.customerId}>
          <Select value={values.customerId} onChange={handleChange('customerId')} disabled={loading}>
            <option value="">Tanlanmagan</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Biznes">
          <Select value={values.businessId} onChange={handleChange('businessId')} disabled={loading}>
            <option value="">Tanlanmagan</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Sotuv xodimi">
        <Select value={values.salesEmployeeId} onChange={handleChange('salesEmployeeId')} disabled={loading}>
          <option value="">Tanlanmagan</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="detail-grid">
        <FormField label="Bosqich">
          <Select value={values.stage} onChange={handleChange('stage')} disabled={loading}>
            {DEAL_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {DEAL_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Qiymati">
          <Input type="number" min="0" value={values.value} onChange={handleChange('value')} disabled={loading} />
        </FormField>
      </div>

      <FormField label="Kutilayotgan yopilish sanasi">
        <Input type="date" value={values.expectedCloseDate} onChange={handleChange('expectedCloseDate')} disabled={loading} />
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
