import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { PasswordInput } from '../../../components/PasswordInput/PasswordInput'
import { Button } from '../../../components/Button/Button'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { ROLE_DEFAULT_PERMISSIONS } from '../../roles/permissions'
import { validate, rules } from '../../../utils/validators'
import './EmployeeForm.scss'

const DEFAULT_VALUES = { firstName: '', lastName: '', phone: '+998', username: '', password: '', partnerGroupId: '' }

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export function EmployeeForm({ initialValues = DEFAULT_VALUES, partnerGroups = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel, canManageAccess = true }) {
  const isEditing = Boolean(initialValues?.id)
  const name = splitName(initialValues.name)
  const [values, setValues] = useState(() => ({
    ...DEFAULT_VALUES,
    ...name,
    ...initialValues,
    phone: initialValues.phone || '+998',
    permissions: Array.isArray(initialValues.permissions)
      ? initialValues.permissions
      : ROLE_DEFAULT_PERMISSIONS[initialValues.role] || ROLE_DEFAULT_PERMISSIONS.EMPLOYEE,
  }))
  const [errors, setErrors] = useState({})

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const handlePhone = (event) => {
    let phone = event.target.value.replace(/[^\d+]/g, '')
    if (!phone.startsWith('+998')) phone = `+998${phone.replace(/^\+?998/, '')}`
    setValues((current) => ({ ...current, phone }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const rulesMap = {
      firstName: [rules.required('Ism kiritilishi shart')],
      phone: [rules.required('Telefon raqami kiritilishi shart')],
    }
    if (!isEditing) {
      rulesMap.username = [rules.required('Login kiritilishi shart'), rules.minLength(3, 'Login kamida 3 belgidan iborat bo\'lishi kerak')]
      rulesMap.password = [rules.required('Parol kiritilishi shart'), rules.minLength(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak')]
    }
    const nextErrors = validate(values, rulesMap)
    if (values.phone.replace(/\D/g, '').length !== 12) nextErrors.phone = 'Telefon raqami noto\'g\'ri'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = { name: `${values.firstName} ${values.lastName}`.trim(), phone: values.phone }
    if (!isEditing || canManageAccess) payload.username = values.username.trim()
    if (canManageAccess) {
      payload.partnerGroupId = values.partnerGroupId || null
      payload.permissions = values.permissions
    }
    if (!isEditing) payload.password = values.password
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="detail-grid">
        <FormField label="Ism" required error={errors.firstName}><Input value={values.firstName} onChange={set('firstName')} error={!!errors.firstName} disabled={loading} autoFocus={!isEditing} /></FormField>
        <FormField label="Familiya"><Input value={values.lastName} onChange={set('lastName')} disabled={loading} /></FormField>
        <FormField label="Telefon" required error={errors.phone}><Input type="tel" value={values.phone} onChange={handlePhone} error={!!errors.phone} disabled={loading} placeholder="+998 90 123 45 67" /></FormField>
      </div>

      {(!isEditing || canManageAccess) && (
        <FormField label="Login" required={!isEditing} error={errors.username}>
          <Input value={values.username} onChange={set('username')} error={!!errors.username} disabled={loading || (isEditing && !canManageAccess)} />
        </FormField>
      )}

      {canManageAccess && (
        <FormField label="Partner guruhi" hint="Faqat shu guruhdagi mijozlar ko'rinadi">
          <Select value={values.partnerGroupId || ''} onChange={set('partnerGroupId')} disabled={loading}>
            <option value="">Partner guruhi biriktirilmagan</option>
            {partnerGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </Select>
        </FormField>
      )}

      {!isEditing && (
        <FormField label="Parol" required error={errors.password}>
          <PasswordInput value={values.password} onChange={set('password')} error={!!errors.password} disabled={loading} />
        </FormField>
      )}

      {canManageAccess && (
        <section className="employee-form__permissions">
          <h3 className="employee-form__section-title">Ruxsatlar</h3>
          <PermissionMatrix value={values.permissions} onChange={(permissions) => setValues((current) => ({ ...current, permissions }))} />
        </section>
      )}

      {isEditing && !canManageAccess && <p className="text-muted text-xs">Login va parolni faqat administrator o'zgartiradi.</p>}
      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Bekor qilish</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
