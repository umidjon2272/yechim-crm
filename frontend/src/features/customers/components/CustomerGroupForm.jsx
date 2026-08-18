import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'

export function CustomerGroupForm({ initialValues = { name: '', partnerRewardPerCustomer: '' }, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ partnerRewardPerCustomer: '', ...initialValues })
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { name: [rules.required('Nom kiritilishi shart')] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, partnerRewardPerCustomer: values.partnerRewardPerCustomer === '' ? null : Number(values.partnerRewardPerCustomer) })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Guruh nomi" required error={errors.name}>
        <Input
          value={values.name}
          onChange={(e) => setValues((current) => ({ ...current, name: e.target.value }))}
          error={!!errors.name}
          disabled={loading}
          placeholder="Masalan: VIP mijozlar"
        />
      </FormField>
      <FormField label="Har yakunlangan mijoz uchun haq" hint="Ixtiyoriy. Masalan: 100">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={values.partnerRewardPerCustomer}
          onChange={(e) => setValues((current) => ({ ...current, partnerRewardPerCustomer: e.target.value }))}
          disabled={loading}
          placeholder="100"
        />
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
