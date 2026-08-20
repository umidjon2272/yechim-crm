import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { NumberInput } from '../../../components/NumberInput/NumberInput'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { customersService } from '../../../services/customers.service'
import { useAsync } from '../../../hooks/useAsync'

export function CustomerGroupForm({ initialValues = { name: '', partnerRewardPerCustomer: '', rewardStageId: '' }, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ partnerRewardPerCustomer: '', ...initialValues })
  const [errors, setErrors] = useState({})
  const { data: stagesData } = useAsync(customersService.listStages, [])
  const stages = stagesData?.items ?? []

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { name: [rules.required('Nom kiritilishi shart')] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, rewardStageId: values.rewardStageId || undefined, partnerRewardPerCustomer: values.partnerRewardPerCustomer === '' ? null : Number(values.partnerRewardPerCustomer) })
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
        <NumberInput
          min="0"
          step="0.01"
          value={values.partnerRewardPerCustomer}
          onChange={(e) => setValues((current) => ({ ...current, partnerRewardPerCustomer: e.target.value }))}
          disabled={loading}
          placeholder="100"
        />
      </FormField>
      <FormField label="Mukofot hisoblanadigan bosqich" hint="Mijoz shu bosqichga birinchi marta kirganda reward yoziladi">
        <Select value={values.rewardStageId || ''} onChange={(e) => setValues((current) => ({ ...current, rewardStageId: e.target.value }))} disabled={loading || stages.length === 0}>
          <option value="">Bosqich tanlanmagan</option>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
        </Select>
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
