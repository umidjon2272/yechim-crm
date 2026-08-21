import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { NumberInput } from '../../../components/NumberInput/NumberInput'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { DateTimePicker } from '../../../components/DateTimePicker/DateTimePicker'
import { validate, rules } from '../../../utils/validators'
import { localDateTimeFromNow, localDateTimeToISOString } from '../../../utils/dateTime'
import { SearchIcon } from '../../../components/icons/Icons'
import { useAsync } from '../../../hooks/useAsync'
import { currenciesService } from '../../../services/currencies.service'
import { BusinessTypeDropdown } from './BusinessTypeDropdown'
import { customerGroupsService } from '../../../services/customers.service'
import { nominatimLabel, reverseNominatim, searchNominatim } from './nominatim'
import './CustomerForm.scss'

const CustomerLocationMap = lazy(() => import('./CustomerLocationMap'))

function MapLoading({ preview = false }) {
  return <div className={`customer-location__map-placeholder${preview ? ' customer-location__map-placeholder--preview' : ''}`}>Xarita yuklanmoqda...</div>
}

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '+998',
  amount: '',
  currencyId: '',
  note: '',
  programName: '',
  address: '',
  latitude: '',
  longitude: '',
  depositAmount: '',
  stage: 'NEW',
  programs: [],
}

const FALLBACK_LOCATION_ERROR = 'Manzilni avtomatik topib bo‘lmadi. Qo‘lda yozishingiz mumkin.'

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export function formatAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address
  return [address.country, address.region, address.city, address.district, address.street, address.house, address.extra].filter(Boolean).join(', ')
}

function coordinateValue(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function CustomerGroupsDropdown({ groups, value = [], onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const selectedIds = Array.isArray(value) ? value : []
  const selectedGroups = groups.filter((group) => selectedIds.includes(group.id))
  const allSelected = groups.length > 0 && selectedGroups.length === groups.length

  useEffect(() => {
    if (!open) return undefined
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const toggleGroup = (groupId) => {
    onChange(selectedIds.includes(groupId) ? selectedIds.filter((id) => id !== groupId) : [...selectedIds, groupId])
  }

  const toggleAll = () => onChange(allSelected ? [] : groups.map((group) => group.id))

  return (
    <div className="customer-groups-dropdown" ref={containerRef}>
      <button
        type="button"
        className="customer-groups-dropdown__trigger"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled || groups.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="customer-groups-dropdown__selection">
          {selectedGroups.length === 0 && <span className="customer-groups-dropdown__placeholder">Guruh tanlang</span>}
          {allSelected && <span className="customer-groups-dropdown__pill">Barcha</span>}
          {!allSelected && selectedGroups.map((group) => <span key={group.id} className="customer-groups-dropdown__pill">{group.name}</span>)}
        </span>
        <span className="customer-groups-dropdown__chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="customer-groups-dropdown__menu" role="listbox" aria-multiselectable="true">
          <label className="customer-groups-dropdown__option customer-groups-dropdown__option--all">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>Barcha</span>
          </label>
          {groups.map((group) => (
            <label key={group.id} className="customer-groups-dropdown__option">
              <input type="checkbox" checked={selectedIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />
              <span>{group.name}</span>
            </label>
          ))}
        </div>
      )}
      {groups.length === 0 && <span className="form-field__hint">Hozircha guruhlar mavjud emas.</span>}
    </div>
  )
}

function LocationField({ values, setValue, loading }) {
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [mapSearch, setMapSearch] = useState(() => values.address || '')
  const [searchResults, setSearchResults] = useState([])
  const [mapOpen, setMapOpen] = useState(() => coordinateValue(values.latitude) !== null && coordinateValue(values.longitude) !== null)
  const searchRequestRef = useRef(0)
  const skipNextSearchRef = useRef(false)
  const latitude = coordinateValue(values.latitude)
  const longitude = coordinateValue(values.longitude)
  const position = latitude !== null && longitude !== null ? [latitude, longitude] : null

  const setSearchText = (value) => {
    skipNextSearchRef.current = true
    setMapSearch(value)
  }

  const setPosition = (nextPosition, address) => {
    setValue('latitude', nextPosition.lat.toFixed(6))
    setValue('longitude', nextPosition.lng.toFixed(6))
    if (address) {
      setValue('address', address)
      setSearchText(address)
    }
  }

  const reverseGeocode = async (nextPosition) => {
    try {
      const result = await reverseNominatim(nextPosition.lat, nextPosition.lng)
      const address = nominatimLabel(result)
      if (address) {
        setValue('address', address)
        setSearchText(address)
        setSearchError('')
      } else {
        setSearchError(FALLBACK_LOCATION_ERROR)
      }
    } catch {
      setSearchError(FALLBACK_LOCATION_ERROR)
    }
  }

  const handleMapPick = async (nextPosition) => {
    setPosition(nextPosition)
    setSearchError('')
    await reverseGeocode(nextPosition)
  }

  const runSearch = useCallback(async (query = mapSearch) => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 3) return
    const requestId = searchRequestRef.current + 1
    searchRequestRef.current = requestId
    setSearching(true)
    setSearchError('')
    try {
      const results = await searchNominatim(normalizedQuery)
      if (requestId !== searchRequestRef.current) return
      setSearchResults(Array.isArray(results) ? results : [])
      if (!results?.length) setSearchError('Manzil topilmadi. Manzilni qo‘lda yozishingiz mumkin.')
    } catch {
      if (requestId === searchRequestRef.current) setSearchError(FALLBACK_LOCATION_ERROR)
    } finally {
      if (requestId === searchRequestRef.current) setSearching(false)
    }
  }, [mapSearch])

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return undefined
    }
    if (!mapOpen || mapSearch.trim().length < 3) {
      setSearchResults([])
      return undefined
    }
    const timer = window.setTimeout(() => runSearch(mapSearch), 700)
    return () => window.clearTimeout(timer)
  }, [mapOpen, mapSearch, runSearch])

  const selectSearchResult = (result) => {
    const nextPosition = { lat: Number(result.lat), lng: Number(result.lon) }
    if (!Number.isFinite(nextPosition.lat) || !Number.isFinite(nextPosition.lng)) return
    const address = nominatimLabel(result) || mapSearch.trim()
    setPosition(nextPosition, address)
    setSearchResults([])
    setSearchError('')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Brauzer joylashuvni aniqlashni qo‘llab-quvvatlamaydi')
      return
    }
    setLocating(true)
    setSearchError('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const nextPosition = { lat: coords.latitude, lng: coords.longitude }
      setMapOpen(true)
      setPosition(nextPosition)
      await reverseGeocode(nextPosition)
      setLocating(false)
    }, (error) => {
      setLocating(false)
      setSearchError(error.code === 1 ? 'Joylashuvga ruxsat berilmadi' : 'Hozirgi joylashuvni aniqlab bo‘lmadi')
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
  }

  const toggleMap = () => {
    setSearchError('')
    setSearchResults([])
    setMapOpen((open) => {
      if (!open) setSearchText(values.address || '')
      return !open
    })
  }

  return (
    <div className="customer-location">
      <FormField label="Manzil" hint="Ixtiyoriy. Matn kiriting yoki xaritadan aniq joyni belgilang">
        <Input value={values.address} onChange={(event) => setValue('address', event.target.value)} disabled={loading} placeholder="Toshkent, Chilonzor tumani" />
        <div className="customer-location__actions">
          <Button type="button" variant="secondary" onClick={toggleMap} disabled={loading}>{mapOpen ? 'Xaritani yopish' : '📍 Xaritadan belgilash'}</Button>
          {mapOpen && <Button type="button" variant="ghost" onClick={useCurrentLocation} loading={locating} disabled={loading}>📍 Hozirgi joyim</Button>}
        </div>
        {searchError && <span className="form-field__error">{searchError}</span>}
      </FormField>

      {mapOpen && (
        <div className="customer-location__map-wrap">
          <div className="customer-location__map-search">
            <Input value={mapSearch} onChange={(event) => setMapSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runSearch()} disabled={loading} placeholder="Manzil qidirish..." />
            <Button type="button" variant="secondary" onClick={() => runSearch()} loading={searching} disabled={loading || mapSearch.trim().length < 3}>
              <SearchIcon width={15} height={15} />
              <span className="customer-location__search-label">Qidirish</span>
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="customer-location__results" role="listbox" aria-label="Manzil qidiruv natijalari">
              {searchResults.map((result) => (
                <button key={`${result.place_id}-${result.lat}-${result.lon}`} type="button" className="customer-location__result" onClick={() => selectSearchResult(result)}>
                  {nominatimLabel(result)}
                </button>
              ))}
            </div>
          )}
          <Suspense fallback={<MapLoading />}>
            <CustomerLocationMap position={position} onPick={handleMapPick} className="customer-location__map" />
          </Suspense>
          <div className="customer-location__map-hint">Xaritani bosing yoki markerni torting — joy va manzil yangilanadi.</div>
          {position && <a className="customer-location__map-link" href={`https://www.openstreetmap.org/?mlat=${position[0]}&mlon=${position[1]}#map=16/${position[0]}/${position[1]}`} target="_blank" rel="noreferrer">Xaritada ochish</a>}
        </div>
      )}
    </div>
  )
}

export function CustomerLocationPreview({ customer }) {
  const address = formatAddress(customer?.address)
  const latitude = coordinateValue(customer?.latitude)
  const longitude = coordinateValue(customer?.longitude)
  const position = latitude !== null && longitude !== null ? [latitude, longitude] : null
  const [mapOpen, setMapOpen] = useState(false)

  if (!address && !position) return null
  return (
    <div className="customer-location__preview">
      {address && <div className="customer-location__preview-address">{address}</div>}
      {position && (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={() => setMapOpen((open) => !open)}>
            {mapOpen ? 'Xaritani yopish' : 'Xaritani ko‘rish'}
          </Button>
          {mapOpen && <Suspense fallback={<MapLoading preview />}>
            <CustomerLocationMap position={position} interactive={false} className="customer-location__map customer-location__map--preview" />
          </Suspense>}
        </>
      )}
      {position && mapOpen && <a className="customer-location__map-link" href={`https://www.openstreetmap.org/?mlat=${position[0]}&mlon=${position[1]}#map=16/${position[0]}/${position[1]}`} target="_blank" rel="noreferrer">Xaritada ochish</a>}
    </div>
  )
}

function quickDateValue(days = 0) {
  return localDateTimeFromNow(days, 14, 0)
}

function serializeQuickAction(action) {
  if (action.type === 'CALL' || action.type === 'REMINDER') {
    return { ...action, remindAt: localDateTimeToISOString(action.remindAt) }
  }
  if (action.type === 'TASK') {
    return { ...action, dueDate: action.dueDate ? localDateTimeToISOString(action.dueDate) : null }
  }
  return action
}

function QuickActionsFields({ values, setValue, employees = [], loading }) {
  const actions = Array.isArray(values.quickActions) ? values.quickActions : []
  const has = (type) => actions.some((action) => action.type === type)
  const toggle = (type) => {
    if (has(type)) {
      setValue('quickActions', actions.filter((action) => action.type !== type))
      return
    }
    const defaults = {
      CALL: { type: 'CALL', remindAt: quickDateValue(0), note: '' },
      REMINDER: { type: 'REMINDER', remindAt: quickDateValue(0), note: '' },
      TASK: { type: 'TASK', title: '', assignedToId: '', dueDate: '', note: '' },
      NOTE: { type: 'NOTE', text: '' },
    }
    setValue('quickActions', [...actions, defaults[type]])
  }
  const update = (type, field, value) => setValue('quickActions', actions.map((action) => action.type === type ? { ...action, [field]: value } : action))
  const action = (type) => actions.find((item) => item.type === type)

  return (
    <section className="customer-form__quick-actions">
      <div className="customer-form__quick-actions-title">Keyingi ish <span className="form-field__hint">ixtiyoriy, customer bilan birga saqlanadi</span></div>
      <div className="customer-form__quick-actions-buttons">
        {['CALL', 'REMINDER', 'TASK', 'NOTE'].map((type) => <Button key={type} type="button" size="sm" variant={has(type) ? 'primary' : 'secondary'} onClick={() => toggle(type)} disabled={loading}>{type === 'CALL' ? "Qo'ng'iroq" : type === 'REMINDER' ? 'Eslatma' : type === 'TASK' ? 'Vazifa' : 'Izoh'}</Button>)}
      </div>
      {action('CALL') && <div className="customer-form__quick-action-detail">
        <strong>Qo'ng'iroq tafsilotlari</strong>
        <div className="quick-date-row">
          <Button type="button" size="sm" variant="secondary" onClick={() => update('CALL', 'remindAt', quickDateValue(0))}>Bugun</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => update('CALL', 'remindAt', quickDateValue(1))}>Ertaga</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => update('CALL', 'remindAt', quickDateValue(3))}>3 kun</Button>
        </div>
        <FormField label="Qachon"><DateTimePicker value={action('CALL').remindAt} onChange={(event) => update('CALL', 'remindAt', event.target.value)} disabled={loading} /></FormField>
        <FormField label="Izoh"><textarea className="textarea" rows={2} value={action('CALL').note} onChange={(event) => update('CALL', 'note', event.target.value)} disabled={loading} /></FormField>
      </div>}
      {action('REMINDER') && <div className="customer-form__quick-action-detail">
        <strong>Eslatma tafsilotlari</strong>
        <FormField label="Sana/vaqt"><DateTimePicker value={action('REMINDER').remindAt} onChange={(event) => update('REMINDER', 'remindAt', event.target.value)} disabled={loading} /></FormField>
        <FormField label="Izoh"><textarea className="textarea" rows={2} value={action('REMINDER').note} onChange={(event) => update('REMINDER', 'note', event.target.value)} disabled={loading} /></FormField>
      </div>}
      {action('TASK') && <div className="customer-form__quick-action-detail">
        <strong>Vazifa tafsilotlari</strong>
        <FormField label="Sarlavha" required><Input value={action('TASK').title} onChange={(event) => update('TASK', 'title', event.target.value)} disabled={loading} placeholder="Mijoz bilan bog'lanish" /></FormField>
        <FormField label="Mas'ul xodim"><Select value={action('TASK').assignedToId} onChange={(event) => update('TASK', 'assignedToId', event.target.value)} disabled={loading}><option value="">O'zim</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</Select></FormField>
        <FormField label="Deadline"><DateTimePicker value={action('TASK').dueDate} onChange={(event) => update('TASK', 'dueDate', event.target.value)} disabled={loading} /></FormField>
        <FormField label="Izoh"><textarea className="textarea" rows={2} value={action('TASK').note} onChange={(event) => update('TASK', 'note', event.target.value)} disabled={loading} /></FormField>
      </div>}
      {action('NOTE') && <div className="customer-form__quick-action-detail">
        <strong>Izoh tafsilotlari</strong>
        <FormField label="Matn" required><textarea className="textarea" rows={3} value={action('NOTE').text} onChange={(event) => update('NOTE', 'text', event.target.value)} disabled={loading} placeholder="Izoh yozing" /></FormField>
      </div>}
    </section>
  )
}

export function CustomerForm({ initialValues, employees = [], submitLabel = 'Saqlash', loading, onSubmit, onCancel, onDelete, canManageGroups = false, canEditCore = true, canViewAmount = true, canViewDeposit = true }) {
  const isEditing = Boolean(initialValues?.id)
  const { data: currenciesData } = useAsync(currenciesService.list, [])
  const currencies = currenciesData?.items ?? []
  const { data: groupsData } = useAsync(() => canManageGroups ? customerGroupsService.list({ pageSize: 100 }) : Promise.resolve({ items: [] }), [canManageGroups])
  const groups = groupsData?.items ?? []
  const initialName = splitName(initialValues?.name)
  const initialAddress = initialValues?.address
  const [values, setValues] = useState(() => ({
    ...DEFAULT_VALUES,
    ...initialName,
    ...initialValues,
    firstName: initialValues?.firstName || initialName.firstName,
    lastName: initialValues?.lastName || initialName.lastName,
    phone: initialValues?.phone || '+998',
    amount: initialValues?.amount ?? '',
    currencyId: initialValues?.currencyId || initialValues?.currency?.id || '',
    businessTypeId: initialValues?.businessTypeId || initialValues?.businessType?.id || '',
    note: initialValues?.note || initialValues?.notes || '',
    depositAmount: initialValues?.depositAmount ?? '',
    programName: initialValues?.service || initialValues?.programs?.[0]?.name || '',
    address: formatAddress(initialAddress),
    latitude: initialValues?.latitude ?? initialAddress?.lat ?? '',
    longitude: initialValues?.longitude ?? initialAddress?.lng ?? '',
    stage: initialValues?.stageId || initialValues?.stage || 'NEW',
    programs: Array.isArray(initialValues?.programs) ? initialValues.programs : [],
    groupIds: Array.isArray(initialValues?.groupIds)
      ? initialValues.groupIds
      : Array.isArray(initialValues?.groups) ? initialValues.groups.map((group) => group.id) : [],
    quickActions: [],
  }))
  const [errors, setErrors] = useState({})
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const setValue = (field, value) => setValues((current) => ({ ...current, [field]: value }))
  const handlePhone = (event) => {
    let phone = event.target.value.replace(/[^\d+]/g, '')
    if (!phone.startsWith('+998')) phone = `+998${phone.replace(/^\+?998/, '')}`
    setValue('phone', phone)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { firstName: [rules.required('Ism kiritilishi shart')], phone: [rules.required('Telefon kiritilishi shart')] })
    if (values.phone.replace(/\D/g, '').length !== 12) nextErrors.phone = 'Telefon raqami noto‘g‘ri'
    if (canViewAmount && values.amount !== '' && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) nextErrors.amount = 'Zakaz summasi 0 dan kam bo‘lmasligi kerak'
    if (canViewDeposit && values.depositAmount !== '' && (!Number.isFinite(Number(values.depositAmount)) || Number(values.depositAmount) < 0)) nextErrors.depositAmount = 'Zaklad summasi 0 dan kam bo‘lmasligi kerak'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const primaryProgramName = values.programName.trim()
    const existingPrograms = Array.isArray(values.programs) ? values.programs : []
    const programs = primaryProgramName
      ? [{ ...(existingPrograms[0] || {}), name: primaryProgramName, status: existingPrograms[0]?.status || 'NEW' }, ...existingPrograms.slice(1)]
      : existingPrograms
    const amount = values.amount === '' ? 0 : Number(values.amount)
    const depositAmount = values.depositAmount === '' ? null : Number(values.depositAmount)
    const latitudeValue = values.latitude === '' ? null : Number(values.latitude)
    const longitudeValue = values.longitude === '' ? null : Number(values.longitude)

    onSubmit({
      name: `${values.firstName} ${values.lastName}`.trim(),
      firstName: values.firstName,
      ...(isEditing ? { lastName: values.lastName } : {}),
      phone: values.phone,
      note: values.note.trim() || null,
      notes: values.note.trim() || null,
      ...(canViewAmount ? { amount: Number.isFinite(amount) ? amount : 0 } : {}),
      ...(canViewAmount ? { currencyId: values.currencyId || currencies.find((currency) => currency.isDefault)?.id || null } : {}),
      ...(canEditCore ? { businessTypeId: values.businessTypeId || null } : {}),
      ...(canViewDeposit ? { depositAmount: Number.isFinite(depositAmount) ? depositAmount : null } : {}),
      ...(canEditCore ? { service: primaryProgramName || null, programs } : {}),
      stage: values.stage,
      ...(canEditCore ? {
        address: values.address.trim() || null,
        latitude: Number.isFinite(latitudeValue) ? latitudeValue : null,
        longitude: Number.isFinite(longitudeValue) ? longitudeValue : null,
      } : {}),
      ...(canManageGroups ? { groupIds: values.groupIds } : {}),
      ...(!isEditing && values.quickActions?.length ? { quickActions: values.quickActions.map(serializeQuickAction) } : {}),
      ...(!isEditing && initialValues?.currentGroupId ? { currentGroupId: initialValues.currentGroupId } : {}),
    }, null)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <div className="detail-grid">
        <FormField label="Ism" required error={errors.firstName}><Input value={values.firstName} onChange={set('firstName')} error={!!errors.firstName} disabled={loading} autoFocus={!isEditing} /></FormField>
        {isEditing && <FormField label="Familiya"><Input value={values.lastName} onChange={set('lastName')} disabled={loading} /></FormField>}
        <FormField label="Telefon" required error={errors.phone}><Input type="tel" value={values.phone} onChange={handlePhone} error={!!errors.phone} disabled={loading} placeholder="+998 90 123 45 67" /></FormField>
        {canViewAmount && <FormField label="Savdo summasi" hint="Mijoz buyurtmasining umumiy qiymati" error={errors.amount}><div className="amount-currency-control"><NumberInput min="0" step="0.01" value={values.amount} onChange={set('amount')} error={!!errors.amount} disabled={loading} placeholder="5 000 000" /><Select className="amount-currency-control__currency" value={values.currencyId || currencies.find((currency) => currency.isDefault)?.id || ''} onChange={set('currencyId')} disabled={loading || currencies.length === 0} aria-label="Valyuta"><option value="">—</option>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code}</option>)}</Select></div></FormField>}
      </div>
      {canEditCore && <div className="detail-grid">
        <FormField label="Biznes turi"><BusinessTypeDropdown value={values.businessTypeId} onChange={(value) => setValue('businessTypeId', value)} disabled={loading} /></FormField>
        <FormField label="Dastur/xizmat"><Input value={values.programName} onChange={set('programName')} disabled={loading} placeholder="Masalan: Bito POS" /></FormField>
         {/* Stage changes are deliberately made from the Kanban drag action so
             deposit/follow-up/installation prompts cannot be bypassed here. */}
        {canViewDeposit && <FormField label="Zaklad summasi" hint="Ixtiyoriy" error={errors.depositAmount}><NumberInput min="0" step="1000" value={values.depositAmount} onChange={set('depositAmount')} error={!!errors.depositAmount} disabled={loading} placeholder="2 000 000" /></FormField>}
      </div>}
      {canEditCore && <LocationField values={values} setValue={setValue} loading={loading} />}
      <FormField label="Izoh"><textarea className="textarea" rows={3} value={values.note} onChange={(event) => setValue('note', event.target.value)} disabled={loading} placeholder="Mijoz haqida qisqa izoh" /></FormField>
      {!isEditing && initialValues?.currentGroupName && <div className="form-field__hint">Bu mijoz <strong>{initialValues.currentGroupName}</strong> guruhiga qo'shiladi.</div>}
      {!isEditing && <QuickActionsFields values={values} setValue={setValue} employees={employees} loading={loading} />}
      {canManageGroups && <FormField label="Guruh" hint="Bir nechta guruh tanlash mumkin"><CustomerGroupsDropdown groups={groups} value={values.groupIds} onChange={(groupIds) => setValue('groupIds', groupIds)} disabled={loading} /></FormField>}
      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onDelete && <Button type="button" variant="danger-ghost" onClick={onDelete} disabled={loading}>O‘chirish</Button>}
        <span style={{ flex: 1 }} />
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Bekor qilish</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
