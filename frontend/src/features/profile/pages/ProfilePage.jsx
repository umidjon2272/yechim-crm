import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { usersService } from '../../../services/users.service'
import { authService } from '../../../services/auth.service'
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

function getCurrentLogin(user) {
  return user?.username || user?.login || user?.email || user?.phone || ''
}

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const updateAction = useAction(usersService.updateProfile)
  const loginAction = useAction(usersService.updateLogin)
  const passwordAction = useAction(authService.changePassword)
  const initialName = splitName(user?.name)
  const currentLogin = getCurrentLogin(user)
  const [values, setValues] = useState({ firstName: initialName.firstName, lastName: initialName.lastName, phone: user?.phone || '', email: user?.email || '' })
  const [login, setLogin] = useState(currentLogin)
  const [passwordValues, setPasswordValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    setLogin(currentLogin)
  }, [currentLogin])

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

  const handleLoginChange = async (event) => {
    event.preventDefault()
    try {
      await loginAction.run(login.trim())
      await refreshUser()
      toast.success('Login yangilandi')
    } catch (err) {
      toast.error(err.message || 'Loginni yangilab bo\'lmadi')
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    if (passwordValues.newPassword.length < 6) return toast.error('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak')
    if (passwordValues.newPassword !== passwordValues.confirmPassword) return toast.error('Parollar mos kelmadi')
    try {
      await passwordAction.run({ currentPassword: passwordValues.currentPassword, newPassword: passwordValues.newPassword })
      toast.success('Parol yangilandi. Xavfsizlik uchun qayta kiring.')
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Parolni yangilab bo\'lmadi')
    }
  }

  const isPartner = Boolean(user?.partnerGroupId && !['ADMIN', 'SUPER_ADMIN'].includes(user?.role))
  const roleLabel = isPartner ? 'Partner' : ROLE_LABELS[user?.role] || user?.role

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
            <FormField label="Login"><Input value={currentLogin} disabled /></FormField>
          </div>
          <p className="text-muted text-xs" style={{ margin: '16px 0' }}>Login va parolni faqat administrator o'zgartiradi.</p>
          <Button type="submit" loading={updateAction.loading}>Saqlash</Button>
        </form>
      </Card>
      {['ADMIN', 'SUPER_ADMIN'].includes(user?.role) && <>
        <Card title="Loginni o'zgartirish">
          <form onSubmit={handleLoginChange} className="stack">
            <FormField label="Joriy login"><Input value={currentLogin} disabled /></FormField>
            <FormField label="Yangi login" required><Input value={login} onChange={(event) => setLogin(event.target.value)} disabled={loginAction.loading} /></FormField>
            <Button type="submit" loading={loginAction.loading}>Loginni saqlash</Button>
          </form>
        </Card>
        <Card title="Parolni o'zgartirish">
          <form onSubmit={handlePasswordChange} className="stack">
            <FormField label="Joriy parol" required><Input type="password" value={passwordValues.currentPassword} onChange={(event) => setPasswordValues((v) => ({ ...v, currentPassword: event.target.value }))} disabled={passwordAction.loading} /></FormField>
            <FormField label="Yangi parol" required><Input type="password" value={passwordValues.newPassword} onChange={(event) => setPasswordValues((v) => ({ ...v, newPassword: event.target.value }))} disabled={passwordAction.loading} /></FormField>
            <FormField label="Yangi parolni tasdiqlash" required><Input type="password" value={passwordValues.confirmPassword} onChange={(event) => setPasswordValues((v) => ({ ...v, confirmPassword: event.target.value }))} disabled={passwordAction.loading} /></FormField>
            <Button type="submit" loading={passwordAction.loading}>Parolni yangilash</Button>
          </form>
        </Card>
      </>}
      <Card title="Hisob">
        <Button type="button" variant="danger-ghost" onClick={handleLogout}>Chiqish</Button>
      </Card>
    </div>
  )
}
