import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { PasswordInput } from '../../../components/PasswordInput/PasswordInput'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { ROLES, ROLE_LABELS, ROLE_DEFAULT_PERMISSIONS } from '../../roles/permissions'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { RefreshIcon, ChevronDownIcon } from '../../../components/icons/Icons'
import './EmployeeForm.scss'

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: ROLES.SALES,
  teamId: '',
  status: 'active',
  // No `permissions` key here on purpose: EmployeeForm's initial state below
  // falls back to the selected role's defaults via `??`, which only kicks
  // in when the field is genuinely absent (undefined) — an explicit `[]`
  // would short-circuit that fallback and always start empty.
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export function EmployeeForm({ initialValues = DEFAULT_VALUES, teams = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const isEditing = Boolean(initialValues?.id)
  const [values, setValues] = useState(() => ({
    ...DEFAULT_VALUES,
    ...splitName(initialValues.name),
    ...initialValues,
    permissions: initialValues.permissions ?? ROLE_DEFAULT_PERMISSIONS[initialValues.role ?? DEFAULT_VALUES.role] ?? [],
  }))
  const [errors, setErrors] = useState({})
  const [permissionsOpen, setPermissionsOpen] = useState(!isEditing)

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handlePermissionsChange = (permissions) => setValues((v) => ({ ...v, permissions }))

  const resetToRoleDefaults = () => setValues((v) => ({ ...v, permissions: ROLE_DEFAULT_PERMISSIONS[v.role] ?? [] }))

  const handleGeneratePassword = () => {
    const generated = generatePassword()
    setValues((v) => ({ ...v, password: generated, confirmPassword: generated }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const rulesMap = {
      firstName: [rules.required('Ism kiritilishi shart')],
      lastName: [rules.required('Familiya kiritilishi shart')],
      phone: [rules.required('Telefon raqam kiritilishi shart')],
      email: [rules.required('Email kiritilishi shart'), rules.email()],
      role: [rules.required('Rol tanlanishi shart')],
      username: [rules.required('Login kiritilishi shart')],
    }
    if (!isEditing) {
      rulesMap.password = [rules.required('Parol kiritilishi shart')]
    }
    const nextErrors = validate(values, rulesMap)
    if (!isEditing && values.password && values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Parollar mos kelmadi'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const { firstName, lastName, ...rest } = values
    const payload = { ...rest, name: `${firstName} ${lastName}`.trim() }
    if (isEditing) {
      // Password changes go through the dedicated "Parolni yangilash" action
      // on the Employee detail page — never silently touched by this form.
      delete payload.password
      delete payload.confirmPassword
    } else {
      delete payload.confirmPassword
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="employee-form__section-title">Shaxsiy ma'lumotlar</div>
      <div className="detail-grid">
        <FormField label="Ism" required error={errors.firstName}>
          <Input value={values.firstName} onChange={handleChange('firstName')} error={!!errors.firstName} disabled={loading} />
        </FormField>
        <FormField label="Familiya" required error={errors.lastName}>
          <Input value={values.lastName} onChange={handleChange('lastName')} error={!!errors.lastName} disabled={loading} />
        </FormField>
      </div>

      <div className="detail-grid">
        <FormField label="Elektron pochta" required error={errors.email}>
          <Input type="email" value={values.email} onChange={handleChange('email')} error={!!errors.email} disabled={loading} />
        </FormField>
        <FormField label="Telefon" required error={errors.phone}>
          <Input value={values.phone} onChange={handleChange('phone')} error={!!errors.phone} disabled={loading} />
        </FormField>
      </div>

      <div className="employee-form__section-title">Kirish ma'lumotlari</div>
      <FormField label="Login" required error={errors.username} hint="Xodim tizimga shu login bilan tanilinadi">
        <Input value={values.username} onChange={handleChange('username')} error={!!errors.username} disabled={loading} />
      </FormField>

      {isEditing ? (
        <p className="text-xs text-muted employee-form__password-hint">
          Parolni o‘zgartirish uchun xodim profilidagi "Parolni yangilash" amalidan foydalaning.
        </p>
      ) : (
        <>
          <div className="detail-grid">
            <FormField label="Vaqtinchalik parol" required error={errors.password}>
              <PasswordInput value={values.password} onChange={handleChange('password')} error={!!errors.password} disabled={loading} />
            </FormField>
            <FormField label="Parolni tasdiqlash" error={errors.confirmPassword}>
              <PasswordInput value={values.confirmPassword} onChange={handleChange('confirmPassword')} error={!!errors.confirmPassword} disabled={loading} />
            </FormField>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleGeneratePassword} disabled={loading}>
            <RefreshIcon width={14} height={14} /> Avtomatik parol yaratish
          </Button>
        </>
      )}

      <div className="employee-form__section-title">Rol va jamoa</div>
      <div className="detail-grid">
        <FormField label="Rol" required error={errors.role}>
          <Select value={values.role} onChange={handleChange('role')} disabled={loading}>
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Jamoa">
          <Select value={values.teamId} onChange={handleChange('teamId')} disabled={loading}>
            <option value="">Jamoa tanlanmagan</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Holat">
        <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
          <option value="active">Faol</option>
          <option value="inactive">Faol emas</option>
        </Select>
      </FormField>

      <button
        type="button"
        className="employee-form__permissions-toggle"
        onClick={() => setPermissionsOpen((v) => !v)}
      >
        <ChevronDownIcon width={16} height={16} style={{ transform: permissionsOpen ? 'rotate(180deg)' : 'none' }} />
        Ruxsatlar
      </button>

      {permissionsOpen && (
        <div className="employee-form__permissions">
          <div className="employee-form__permissions-actions">
            <Button type="button" variant="ghost" size="sm" onClick={resetToRoleDefaults} disabled={loading}>
              Rol standart ruxsatlariga qaytarish
            </Button>
          </div>
          <PermissionMatrix value={values.permissions} onChange={handlePermissionsChange} />
        </div>
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
