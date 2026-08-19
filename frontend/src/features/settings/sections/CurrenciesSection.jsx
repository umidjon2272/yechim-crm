import { useState } from 'react'
import { currenciesService } from '../../../services/currencies.service'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useToast } from '../../../store/ToastContext'
import { useAuth } from '../../auth/useAuth'
import { Card } from '../../../components/Card/Card'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'

const EMPTY = { code: '', name: '', symbol: '', isDefault: false }

export function CurrenciesSection() {
  const { user } = useAuth()
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const { data, loading, error, refetch } = useAsync(currenciesService.list, [])
  const [values, setValues] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const saveAction = useAction((payload) => editingId ? currenciesService.update(editingId, payload) : currenciesService.create(payload))
  const updateAction = useAction((id, payload) => currenciesService.update(id, payload))
  const toast = useToast()
  const currencies = data?.items ?? []

  const save = async (event) => {
    event.preventDefault()
    try {
      await saveAction.run(values)
      setValues(EMPTY)
      setEditingId(null)
      await refetch()
      toast.success('Valyuta saqlandi')
    } catch (err) {
      toast.error(err.message || 'Valyutani saqlab bo\'lmadi')
    }
  }

  const update = async (id, payload, message) => {
    try {
      await updateAction.run(id, payload)
      await refetch()
      toast.success(message)
    } catch (err) {
      toast.error(err.message || 'Valyutani yangilab bo\'lmadi')
    }
  }

  return (
    <Card title="Valyutalar" subtitle="Customer summalari valyuta bo'yicha alohida saqlanadi.">
      {error && <p className="form-field__error">{error.message}</p>}
      {isAdmin && <form onSubmit={save} className="stack" style={{ marginBottom: 20 }}>
        <div className="detail-grid">
          <FormField label="Code" required><Input value={values.code} onChange={(event) => setValues((v) => ({ ...v, code: event.target.value }))} placeholder="USD" /></FormField>
          <FormField label="Nomi" required><Input value={values.name} onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))} placeholder="AQSh dollari" /></FormField>
          <FormField label="Belgi" required><Input value={values.symbol} onChange={(event) => setValues((v) => ({ ...v, symbol: event.target.value }))} placeholder="$" /></FormField>
        </div>
        <div>
          <Button type="submit" loading={saveAction.loading}>{editingId ? 'Yangilash' : 'Valyuta qo\'shish'}</Button>
          {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setValues(EMPTY) }}>Bekor qilish</Button>}
        </div>
      </form>}
      {loading ? <p className="text-muted text-xs">Yuklanmoqda...</p> : <div className="stack">
        {currencies.map((currency) => <div key={currency.id} className="detail-grid" style={{ alignItems: 'center' }}>
          <strong>{currency.symbol} {currency.code}</strong><span>{currency.name}</span><span>{currency.isDefault ? 'Default' : currency.isActive ? 'Faol' : 'Faol emas'}</span>
          {isAdmin && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(currency.id); setValues({ code: currency.code, name: currency.name, symbol: currency.symbol, isDefault: currency.isDefault }) }}>Tahrirlash</Button>
            {!currency.isDefault && currency.isActive && <Button type="button" size="sm" variant="ghost" onClick={() => update(currency.id, { isDefault: true }, 'Default valyuta o\'zgardi')}>Default qilish</Button>}
            {currency.isActive ? <Button type="button" size="sm" variant="danger-ghost" onClick={() => update(currency.id, { isActive: false }, 'Valyuta faolsizlantirildi')}>Faolsizlantirish</Button> : <Button type="button" size="sm" variant="ghost" onClick={() => update(currency.id, { isActive: true }, 'Valyuta faollashtirildi')}>Faollashtirish</Button>}
          </div>}
        </div>)}
      </div>}
    </Card>
  )
}
