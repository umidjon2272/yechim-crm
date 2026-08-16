import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '../tasks.constants'

const DEFAULT_VALUES = {
  title: '',
  description: '',
  assignedEmployeeId: '',
  customerId: '',
  businessId: '',
  leadId: '',
  dealId: '',
  dueDate: '',
  priority: 'MEDIUM',
  status: 'TODO',
}

export function TaskForm({ initialValues = DEFAULT_VALUES, employees = [], context, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues, ...context })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      title: [rules.required('Sarlavha kiritilishi shart')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Sarlavha" required error={errors.title}>
        <Input value={values.title} onChange={handleChange('title')} error={!!errors.title} disabled={loading} />
      </FormField>

      <FormField label="Tavsif">
        <textarea className="textarea" rows={3} value={values.description} onChange={handleChange('description')} disabled={loading} />
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

      <div className="detail-grid">
        <FormField label="Muddat">
          <Input type="date" value={values.dueDate} onChange={handleChange('dueDate')} disabled={loading} />
        </FormField>
        <FormField label="Muhimlik">
          <Select value={values.priority} onChange={handleChange('priority')} disabled={loading}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Holat">
        <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
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
