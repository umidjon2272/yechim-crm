import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { usersService } from '../../../services/users.service'
import { Card } from '../../../components/Card/Card'
import { Avatar } from '../../../components/Avatar/Avatar'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
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
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const updateAction = useAction(usersService.updateProfile)
  const initialName = splitName(user?.name)
  const [values, setValues] = useState({ firstName: initialName.firstName, lastName: initialName.lastName, phone: user?.phone || '', email: user?.email || '' })

  const handleChange = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await updateAction.run({ name: `${values.firstName} ${values.lastName}`.trim(), phone: values.phone, email: values.email })
      await refreshUser()
      toast.success('Profil yangilandi')
    } catch (err) {
      toast.error(err.message || 'Profilni yangilashda xatolik yuz berdi')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const roleLabel = user?.partnerGroupId ? 'Partner' : ROLE_LABELS[user?.role] || user?.role

  return (
    <div className="stack">
      <div className="profile-header">
        <Avatar name={user?.name} src={user?.avatarUrl} size="xl" />
        <div>
          <div className="profile-header__name">{user?.name}</div>
          <div className="profile-header__role">{roleLabel}</div>
        </div>
      </div>
      <Card title="Shaxsiy ma'lumotlar">
        <form onSubmit={handleSubmit} noValidate>
          <div className="detail-grid">
            <FormField label="Ism"><Input value={values.firstName} onChange={handleChange('firstName')} disabled={updateAction.loading} /></FormField>
            <FormField label="Familiya"><Input value={values.lastName} onChange={handleChange('lastName')} disabled={updateAction.loading} /></FormField>
            <FormField label="Telefon"><Input value={values.phone} onChange={handleChange('phone')} disabled={updateAction.loading} /></FormField>
            <FormField label="Elektron pochta"><Input type="email" value={values.email} onChange={handleChange('email')} disabled={updateAction.loading} /></FormField>
            <FormField label="Rol"><Input value={roleLabel} disabled /></FormField>
          </div>
          <p className="text-muted text-xs" style={{ margin: '16px 0' }}>Login va parolni faqat administrator o'zgartiradi.</p>
          <Button type="submit" loading={updateAction.loading}>Saqlash</Button>
        </form>
      </Card>
      <Card title="Hisob">
        <Button type="button" variant="danger-ghost" onClick={handleLogout}>Chiqish</Button>
      </Card>
    </div>
  )
}
