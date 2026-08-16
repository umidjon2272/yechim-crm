import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '../activities.constants'
import { useAsync } from '../../../hooks/useAsync'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { leadsService } from '../../../services/leads.service'
import { dealsService } from '../../../services/deals.service'

const DEFAULT_VALUES = {
  type: 'CALL',
  title: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  duration: '',
  result: '',
  nextAction: '',
}

/**
 * `context` fixes the related entity (e.g. { customerId: '123' }) when
 * opened from a detail page — those fields are sent silently and not shown
 * as editable. When no context is given (the standalone Activities page),
 * optional entity pickers are shown so the activity can be linked manually.
 */
export function ActivityForm({ context, loading, onSubmit, onCancel }) {
  const [values, setValues] = useState(DEFAULT_VALUES)
  const [links, setLinks] = useState({ customerId: '', businessId: '', leadId: '', dealId: '' })
  const [errors, setErrors] = useState({})

  const showPickers = !context
  const { data: customers } = useAsync(() => (showPickers ? customersService.list({ pageSize: 50 }) : Promise.resolve(null)), [showPickers])
  const { data: businesses } = useAsync(() => (showPickers ? businessesService.list({ pageSize: 50 }) : Promise.resolve(null)), [showPickers])
  const { data: leads } = useAsync(() => (showPickers ? leadsService.list({ pageSize: 50 }) : Promise.resolve(null)), [showPickers])
  const { data: deals } = useAsync(() => (showPickers ? dealsService.list({ pageSize: 50 }) : Promise.resolve(null)), [showPickers])

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))
  const handleLinkChange = (field) => (event) => setLinks((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      title: [rules.required('Sarlavha kiritilishi shart')],
      date: [rules.required('Sana kiritilishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = { ...values, ...(context || links) }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') delete payload[key]
    })
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Turi" required>
        <Select value={values.type} onChange={handleChange('type')} disabled={loading}>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Sarlavha" required error={errors.title}>
        <Input value={values.title} onChange={handleChange('title')} error={!!errors.title} disabled={loading} />
      </FormField>

      <FormField label="Tavsif">
        <textarea className="textarea" rows={3} value={values.description} onChange={handleChange('description')} disabled={loading} />
      </FormField>

      <div className="detail-grid">
        <FormField label="Sana" required error={errors.date}>
          <Input type="date" value={values.date} onChange={handleChange('date')} error={!!errors.date} disabled={loading} />
        </FormField>
        <FormField label="Davomiyligi (daqiqa)">
          <Input type="number" min="0" value={values.duration} onChange={handleChange('duration')} disabled={loading} />
        </FormField>
      </div>

      <FormField label="Natija">
        <Input value={values.result} onChange={handleChange('result')} disabled={loading} />
      </FormField>

      <FormField label="Keyingi qadam">
        <Input value={values.nextAction} onChange={handleChange('nextAction')} disabled={loading} />
      </FormField>

      {showPickers && (
        <div className="detail-grid">
          <FormField label="Mijoz">
            <Select value={links.customerId} onChange={handleLinkChange('customerId')} disabled={loading}>
              <option value="">—</option>
              {(customers?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Biznes">
            <Select value={links.businessId} onChange={handleLinkChange('businessId')} disabled={loading}>
              <option value="">—</option>
              {(businesses?.items ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Murojaat">
            <Select value={links.leadId} onChange={handleLinkChange('leadId')} disabled={loading}>
              <option value="">—</option>
              {(leads?.items ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Savdo">
            <Select value={links.dealId} onChange={handleLinkChange('dealId')} disabled={loading}>
              <option value="">—</option>
              {(deals?.items ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      )}

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
