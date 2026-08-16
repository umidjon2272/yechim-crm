import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { usersService } from '../../../services/users.service'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { PasswordInput } from '../../../components/PasswordInput/PasswordInput'
import { Button } from '../../../components/Button/Button'
import { useAction } from '../../../hooks/useAction'
import { useToast } from '../../../store/ToastContext'
import { ROLE_LABELS } from '../../roles/permissions'
import './ProfilePage.scss'

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const updateAction = useAction(usersService.updateProfile)
  const initialName = splitName(user?.name)

  const [values, setValues] = useState({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
    phone: user?.phone || '',
    email: user?.email || '',
    username: user?.username || '',
    avatarUrl: user?.avatarUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      toast.error('Yangi parol tasdiqlanmadi')
      return
    }

    try {
      const payload = {
        name: `${values.firstName} ${values.lastName}`.trim(),
        phone: values.phone,
        email: values.email,
        username: values.username,
        avatarUrl: values.avatarUrl,
      }
      if (values.newPassword) {
        payload.currentPassword = values.currentPassword
        payload.newPassword = values.newPassword
        payload.confirmPassword = values.confirmPassword
      }
      await updateAction.run(payload)
      await refreshUser()
      setValues((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('Profil yangilandi')
    } catch (err) {
      toast.error(err.message || 'Profilni yangilashda xatolik yuz berdi')
    }
  }

  return (
    <div className="stack">
      <div className="profile-header">
        <Avatar name={user?.name} src={user?.avatarUrl} size="xl" />
        <div>
          <div className="profile-header__name">{user?.name}</div>
          <div className="profile-header__role">{ROLE_LABELS[user?.role] || user?.role}</div>
        </div>
      </div>

      <Card title="Shaxsiy ma'lumotlar">
        <form onSubmit={handleSubmit} noValidate>
          <div className="detail-grid">
            <FormField label="Ism">
              <Input value={values.firstName} onChange={handleChange('firstName')} disabled={updateAction.loading} />
            </FormField>
            <FormField label="Familiya">
              <Input value={values.lastName} onChange={handleChange('lastName')} disabled={updateAction.loading} />
            </FormField>
          </div>

          <div className="detail-grid">
            <FormField label="Telefon">
              <Input value={values.phone} onChange={handleChange('phone')} disabled={updateAction.loading} />
            </FormField>
            <FormField label="Login">
              <Input value={values.username} onChange={handleChange('username')} disabled={updateAction.loading} />
            </FormField>
          </div>

          <FormField label="Elektron pochta">
            <Input type="email" value={values.email} onChange={handleChange('email')} disabled={updateAction.loading} />
          </FormField>
          <FormField label="Profil rasmi URL">
            <Input value={values.avatarUrl} onChange={handleChange('avatarUrl')} disabled={updateAction.loading} />
          </FormField>
          <FormField label="Rol">
            <Input value={ROLE_LABELS[user?.role] || user?.role || ''} disabled />
          </FormField>
          <FormField label="Jamoa">
            <Input value={user?.team?.name || 'Tayinlanmagan'} disabled />
          </FormField>

          <div className="profile-form__section-title">Parolni almashtirish</div>
          <FormField label="Joriy parol">
            <PasswordInput value={values.currentPassword} onChange={handleChange('currentPassword')} disabled={updateAction.loading} />
          </FormField>
          <div className="detail-grid">
            <FormField label="Yangi parol">
              <PasswordInput value={values.newPassword} onChange={handleChange('newPassword')} disabled={updateAction.loading} />
            </FormField>
            <FormField label="Yangi parolni tasdiqlash">
              <PasswordInput value={values.confirmPassword} onChange={handleChange('confirmPassword')} disabled={updateAction.loading} />
            </FormField>
          </div>

          <Button type="submit" loading={updateAction.loading}>
            Saqlash
          </Button>
        </form>
      </Card>
    </div>
  )
}
