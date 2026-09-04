import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { validate, rules } from '../../../utils/validators'

const DEFAULT_VALUES = { name: '', description: '', permissions: [] }

export function RoleForm({ initialValues = DEFAULT_VALUES, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))
  const handlePermissionsChange = (permissions) => setValues((v) => ({ ...v, permissions }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { name: [rules.required('Rol nomi kiritilishi shart')] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Rol nomi" required error={errors.name}>
        <Input value={values.name} onChange={handleChange('name')} error={!!errors.name} disabled={loading} />
      </FormField>

      <FormField label="Tavsif">
        <textarea className="textarea" rows={2} value={values.description} onChange={handleChange('description')} disabled={loading} />
      </FormField>

      <FormField label="Ruxsatlar">
        <PermissionMatrix value={values.permissions} onChange={handlePermissionsChange} />
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
