import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { CUSTOM_FIELD_TYPES, CUSTOM_FIELD_TYPE_LABELS } from '../../customers/customers.constants'

const DEFAULT_VALUES = { label: '', type: 'TEXT', optionsText: '' }

export function CustomerFieldForm({ initialValues = DEFAULT_VALUES, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    ...DEFAULT_VALUES,
    ...initialValues,
    optionsText: (initialValues.options || []).join(', '),
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { label: [rules.required('Nom kiritilishi shart')] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const { optionsText, ...rest } = values
    onSubmit({
      ...rest,
      options: values.type === 'SELECT' ? optionsText.split(',').map((o) => o.trim()).filter(Boolean) : [],
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Maydon nomi" required error={errors.label}>
        <Input value={values.label} onChange={handleChange('label')} error={!!errors.label} disabled={loading} placeholder="Masalan: Qurilmalar soni" />
      </FormField>

      <FormField label="Maydon turi">
        <Select value={values.type} onChange={handleChange('type')} disabled={loading}>
          {CUSTOM_FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {CUSTOM_FIELD_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </FormField>

      {values.type === 'SELECT' && (
        <FormField label="Variantlar" hint="Vergul bilan ajrating">
          <Input value={values.optionsText} onChange={handleChange('optionsText')} disabled={loading} placeholder="Variant 1, Variant 2" />
        </FormField>
      )}

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
