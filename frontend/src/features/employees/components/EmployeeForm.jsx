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

const DEFAULT_VALUES = { firstName: '', lastName: '', phone: '+998', username: '', password: '', role: 'EMPLOYEE', partnerGroupId: '', customerVisibility: 'ASSIGNED', allowedGroupIds: [] }
const LEGACY_FINANCIAL_PERMISSIONS = ['customers.viewAmount', 'customers.viewDeposit', 'customers.viewPipelineTotal']

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export function EmployeeForm({ initialValues = DEFAULT_VALUES, partnerGroups = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel, canManageAccess = true }) {
  const isEditing = Boolean(initialValues?.id)
  const name = splitName(initialValues.name)
  const initialPermissions = Array.isArray(initialValues.permissions)
    ? initialValues.permissions
    : ROLE_DEFAULT_PERMISSIONS[initialValues.role] || ROLE_DEFAULT_PERMISSIONS.EMPLOYEE
  const legacyFinancialConfigured = LEGACY_FINANCIAL_PERMISSIONS.some((permission) => initialPermissions.includes(permission))
  const [values, setValues] = useState(() => ({
    ...DEFAULT_VALUES,
    ...name,
    ...initialValues,
    phone: initialValues.phone || '+998',
    role: initialValues.role || 'EMPLOYEE',
    customerVisibility: initialValues.customerVisibility || 'ASSIGNED',
    allowedGroupIds: Array.isArray(initialValues.allowedGroupIds) ? initialValues.allowedGroupIds : [],
    // Existing users used the granular financial permissions before the
    // master toggle existed. Reflect that legacy configuration as enabled so
    // an admin can switch it off and remove all financial permissions at once.
    permissions: initialPermissions.includes('customers.viewFinancials') || !legacyFinancialConfigured
      ? initialPermissions
      : [...initialPermissions, 'customers.viewFinancials'],
  }))
  const [errors, setErrors] = useState({})

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const isEmployee = values.role === 'EMPLOYEE'
  const isPartner = values.role === 'PARTNER'
  const toggleGroup = (groupId) => setValues((current) => ({ ...current, allowedGroupIds: current.allowedGroupIds.includes(groupId) ? current.allowedGroupIds.filter((id) => id !== groupId) : [...current.allowedGroupIds, groupId] }))
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
      payload.role = values.role
      payload.partnerGroupId = isPartner ? values.partnerGroupId || null : null
      payload.customerVisibility = isEmployee ? values.customerVisibility : 'ASSIGNED'
      payload.allowedGroupIds = isEmployee && values.customerVisibility === 'GROUPS' ? values.allowedGroupIds : []
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
        <>
          <FormField label="Rol">
            <Select value={values.role || 'EMPLOYEE'} onChange={(event) => setValues((current) => ({ ...current, role: event.target.value, partnerGroupId: event.target.value === 'PARTNER' ? current.partnerGroupId : '' }))} disabled={loading}>
              <option value="EMPLOYEE">Xodim</option>
              <option value="PARTNER">Partner</option>
              <option value="MANAGER">Menejer</option>
              <option value="SALES">Sotuvchi</option>
              <option value="SUPPORT">Qo'llab-quvvatlash</option>
              <option value="INSTALLER">O'rnatuvchi</option>
              <option value="DEVELOPER">Dasturchi</option>
            </Select>
          </FormField>
          {isPartner && <FormField label="Partner guruhi" required hint="Partner faqat shu guruh mijozlarini ko'radi">
            <Select value={values.partnerGroupId || ''} onChange={set('partnerGroupId')} disabled={loading}>
              <option value="">Partner guruhi tanlang</option>
              {partnerGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </Select>
          </FormField>}
          {isEmployee && <>
            <FormField label="Mijozlar ko'rinishi" hint="Xodimning customer scope'i backendda ham tekshiriladi">
              <Select value={values.customerVisibility || 'ASSIGNED'} onChange={set('customerVisibility')} disabled={loading}>
                <option value="ALL">Barcha mijozlar</option>
                <option value="ASSIGNED">Faqat o'ziga biriktirilgan</option>
                <option value="GROUPS">Faqat tanlangan guruh(lar)</option>
              </Select>
            </FormField>
            {values.customerVisibility === 'GROUPS' && <div className="employee-form__group-access">
              <div className="form-field__label">Ruxsat berilgan guruhlar</div>
              {partnerGroups.length === 0 && <span className="form-field__hint">Hozircha guruhlar mavjud emas.</span>}
              {partnerGroups.map((group) => <label key={group.id} className="employee-form__group-option"><input type="checkbox" checked={values.allowedGroupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} disabled={loading} /> {group.name}</label>)}
            </div>}
          </>}
        </>
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
