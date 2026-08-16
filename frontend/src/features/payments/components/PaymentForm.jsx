import { useEffect, useState } from 'react'
import { dealsService } from '../../../services/deals.service'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '../payments.constants'

const DEFAULT_VALUES = {
  dealId: '',
  amount: '',
  method: 'CASH',
  status: 'PAID',
  date: new Date().toISOString().slice(0, 10),
}

/**
 * `remaining` is computed client-side (deal value minus already-recorded
 * payments) purely to stop an obviously-wrong amount from being submitted —
 * the backend is the real source of truth and must enforce this for real.
 */
export function PaymentForm({ deals = [], lockDeal = false, initialValues, submitLabel = 'Saqlash', loading, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!values.dealId) {
      setRemaining(null)
      return
    }
    let cancelled = false
    Promise.all([dealsService.get(values.dealId), dealsService.getPayments(values.dealId)])
      .then(([deal, paymentsRes]) => {
        if (cancelled) return
        const paid = (paymentsRes?.items ?? paymentsRes ?? [])
          .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        const total = deal?.value != null ? Number(deal.value) : null
        setRemaining(total != null ? Math.max(0, total - paid) : null)
      })
      .catch(() => setRemaining(null))
    return () => {
      cancelled = true
    }
  }, [values.dealId])

  const handleChange = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      dealId: [rules.required('Savdo tanlanishi shart')],
      amount: [rules.required('Summa kiritilishi shart')],
      date: [rules.required('Sana kiritilishi shart')],
    })
    if (!nextErrors.amount && remaining != null && Number(values.amount) > remaining) {
      nextErrors.amount = `Summa qolgan qarzdan (${remaining}) oshmasligi kerak`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, amount: Number(values.amount) })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Savdo" required error={errors.dealId}>
        <Select value={values.dealId} onChange={handleChange('dealId')} disabled={loading || lockDeal}>
          <option value="">Tanlanmagan</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name}
            </option>
          ))}
        </Select>
        {remaining != null && <span className="form-field__hint">Qolgan qarz: {remaining}</span>}
      </FormField>

      <FormField label="Summa" required error={errors.amount}>
        <Input
          type="number"
          min="0"
          max={remaining ?? undefined}
          value={values.amount}
          onChange={handleChange('amount')}
          error={!!errors.amount}
          disabled={loading}
        />
      </FormField>

      <div className="detail-grid">
        <FormField label="To‘lov usuli">
          <Select value={values.method} onChange={handleChange('method')} disabled={loading}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Holat">
          <Select value={values.status} onChange={handleChange('status')} disabled={loading}>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Sana" required error={errors.date}>
        <Input type="date" value={values.date} onChange={handleChange('date')} error={!!errors.date} disabled={loading} />
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
