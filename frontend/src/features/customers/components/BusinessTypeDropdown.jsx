import { useState } from 'react'
import { businessTypesService } from '../../../services/customers.service'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import './CustomerForm.scss'

export function BusinessTypeDropdown({ value, onChange, disabled = false }) {
  const { user } = useAuth()
  const { data, error: loadError, loading, refetch } = useAsync(businessTypesService.list, [])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
  const canCreate = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const selected = items.find((item) => item.id === value)

  const create = async (event) => {
    event?.preventDefault()
    event?.stopPropagation()
    const name = draft.trim()
    if (!name || creating) return
    const duplicate = items.find((item) => String(item.name || '').trim().toLocaleLowerCase() === name.toLocaleLowerCase())
    if (duplicate) {
      setError('Bu biznes turi allaqachon mavjud')
      return
    }
    setCreating(true)
    setError('')
    try {
      const item = await businessTypesService.create({ name })
      await refetch()
      onChange(item.id)
      setDraft('')
      setOpen(false)
    } catch (err) {
      setError(err.message || 'Biznes turini qo\'shib bo\'lmadi')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.stopPropagation()
    create(event)
  }

  return (
    <div className="business-type-dropdown">
      <button
        type="button"
        className="business-type-dropdown__trigger"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled || loading}
        aria-expanded={open}
      >
        <span>{selected?.name || 'Biznes turi tanlanmagan'}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="business-type-dropdown__menu">
          <button type="button" className="business-type-dropdown__option" onClick={() => { onChange(''); setOpen(false) }}>
            Biznes turi tanlanmagan
          </button>
          {items.map((item) => (
            <button key={item.id} type="button" className="business-type-dropdown__option" onClick={() => { onChange(item.id); setOpen(false) }}>
              {item.name}
            </button>
          ))}
          {canCreate && (
            <div className="business-type-dropdown__create">
              <button type="button" className="business-type-dropdown__new-action" onClick={() => setDraft((current) => current || ' ')}>
                + Yangi biznes turi
              </button>
              {(draft !== '' || error) && (
                <div className="business-type-dropdown__create-row">
                  <Input value={draft.trimStart()} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleCreateKeyDown} placeholder="Avtoservis" autoFocus />
                  <Button type="button" size="sm" loading={creating} disabled={!draft.trim()} onClick={create}>Qo‘shish</Button>
                </div>
              )}
              {error && <span className="business-type-dropdown__error">{error}</span>}
            </div>
          )}
        </div>
      )}
      {loadError && !open && (
        <div className="business-type-dropdown__error">
          Biznes turlarini yuklab bo‘lmadi.{' '}
          <Button type="button" size="sm" variant="ghost" onClick={() => refetch().catch(() => {})}>Qayta urinish</Button>
        </div>
      )}
    </div>
  )
}
