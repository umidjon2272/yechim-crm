import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  INTEREST_LEVELS,
  INTEREST_LEVEL_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from '../leads.constants'

const DEFAULT_VALUES = {
  title: '',
  customerId: '',
  businessId: '',
  source: 'WEBSITE',
  assignedEmployeeId: '',
  interestLevel: 'MEDIUM',
  need: '',
  interestedProduct: '',
  status: 'NEW',
  expectedValue: '',
  nextFollowUpDate: '',
  notes: '',
}

export function LeadForm({ initialValues = DEFAULT_VALUES, customers = [], businesses = [], employees = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      title: [rules.required('Murojaat sarlavhasi kiritilishi shart')],
      customerId: [rules.required('Mijoz tanlanishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Murojaat sarlavhasi" required error={errors.title}>
        <Input value={values.title} onChange={handleChange('title')} error={!!errors.title} disabled={loading} />
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

      <div className="detail-grid">
        <FormField label="Manba">
          <Select value={values.source} onChange={handleChange('source')} disabled={loading}>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {LEAD_SOURCE_LABELS[source]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Qiziqish darajasi">
          <Select value={values.interestLevel} onChange={handleChange('interestLevel')} disabled={loading}>
            {INTEREST_LEVELS.map((level) => (
              <option key={level} value={level}>
                {INTEREST_LEVEL_LABELS[level]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

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

      <FormField label="Ehtiyoj / muammo">
        <textarea className="textarea" rows={2} value={values.need} onChange={handleChange('need')} disabled={loading} />
      </FormField>

      <FormField label="Qiziqqan mahsulot">
        <Input value={values.interestedProduct} onChange={handleChange('interestedProduct')} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Holat">
          <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Kutilayotgan summa">
          <Input type="number" min="0" value={values.expectedValue} onChange={handleChange('expectedValue')} disabled={loading} />
        </FormField>
      </div>

      <FormField label="Keyingi follow-up sanasi">
        <Input type="date" value={values.nextFollowUpDate} onChange={handleChange('nextFollowUpDate')} disabled={loading} />
      </FormField>

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
