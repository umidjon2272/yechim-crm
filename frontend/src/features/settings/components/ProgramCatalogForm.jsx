import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'

const DEFAULT_VALUES = { name: '', type: '', version: '', description: '' }

export function ProgramCatalogForm({ initialValues = DEFAULT_VALUES, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { name: [rules.required('Dastur nomi kiritilishi shart')] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Nom" required error={errors.name}>
        <Input value={values.name} onChange={handleChange('name')} error={!!errors.name} disabled={loading} placeholder="Masalan: Bito" />
      </FormField>
      <div className="detail-grid">
        <FormField label="Turi">
          <Input value={values.type} onChange={handleChange('type')} disabled={loading} placeholder="POS, CRM, ERP, Ombor..." />
        </FormField>
        <FormField label="Versiya">
          <Input value={values.version} onChange={handleChange('version')} disabled={loading} placeholder="1.0" />
        </FormField>
      </div>
      <FormField label="Izoh">
        <Input value={values.description} onChange={handleChange('description')} disabled={loading} />
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
