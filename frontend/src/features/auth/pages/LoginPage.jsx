import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { validate, rules } from '../../../utils/validators'

// No LoginPage.scss — every class this page uses (auth-layout__*, form-field,
// input, btn, alert) already lives colocated with its owning component.

export function LoginPage() {
  const { login, loginLoading, loginError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errors = validate(values, {
    email: [rules.required('Login yoki elektron pochta kiritilishi shart')],
      password: [rules.required('Parol kiritilishi shart')],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await login(values)
      navigate(from, { replace: true })
    } catch {
      // loginError is already surfaced from AuthContext
    }
  }

  return (
    <>
      <h1 className="auth-layout__title">Xush kelibsiz</h1>
      <p className="auth-layout__subtitle">YECHIM tizimiga kirish uchun ma'lumotlaringizni kiriting</p>

      {loginError && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="danger">{loginError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Login yoki elektron pochta" required error={fieldErrors.email}>
          <Input
            type="email"
            autoComplete="username"
            placeholder="login yoki siz@misol.uz"
            value={values.email}
            onChange={handleChange('email')}
            error={!!fieldErrors.email}
            disabled={loginLoading}
          />
        </FormField>

        <FormField label="Parol" required error={fieldErrors.password}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={handleChange('password')}
            error={!!fieldErrors.password}
            disabled={loginLoading}
          />
        </FormField>

        <Button type="submit" block loading={loginLoading} disabled={loginLoading}>
          Kirish
        </Button>
      </form>
    </>
  )
}
