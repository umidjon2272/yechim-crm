import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { validate, rules } from '../../../utils/validators'
import { SearchIcon } from '../../../components/icons/Icons'
import { useAsync } from '../../../hooks/useAsync'
import { currenciesService } from '../../../services/currencies.service'
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

  if (!address && !position) return null
  return (
    <div className="customer-location__preview">
      {address && <div className="customer-location__preview-address">{address}</div>}
      {position && (
        <Suspense fallback={<MapLoading preview />}>
          <CustomerLocationMap position={position} interactive={false} className="customer-location__map customer-location__map--preview" />
        </Suspense>
      )}
      {position && <a className="customer-location__map-link" href={`https://www.openstreetmap.org/?mlat=${position[0]}&mlon=${position[1]}#map=16/${position[0]}/${position[1]}`} target="_blank" rel="noreferrer">Xaritada ochish</a>}
    </div>
  )
}

export function CustomerForm({ initialValues, submitLabel = 'Saqlash', loading, onSubmit, onCancel, onDelete, canManageGroups = false }) {
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
  }))
  const [errors, setErrors] = useState({})
  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const setValue = (field, value) => setValues((current) => ({ ...current, [field]: value }))
  const setGroups = (event) => setValue('groupIds', Array.from(event.target.selectedOptions).map((option) => option.value))
  const handlePhone = (event) => {
    let phone = event.target.value.replace(/[^\d+]/g, '')
    if (!phone.startsWith('+998')) phone = `+998${phone.replace(/^\+?998/, '')}`
    setValue('phone', phone)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { firstName: [rules.required('Ism kiritilishi shart')], phone: [rules.required('Telefon kiritilishi shart')] })
    if (values.phone.replace(/\D/g, '').length !== 12) nextErrors.phone = 'Telefon raqami noto‘g‘ri'
    if (values.amount !== '' && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) nextErrors.amount = 'Zakaz summasi 0 dan kam bo‘lmasligi kerak'
    if (values.depositAmount !== '' && (!Number.isFinite(Number(values.depositAmount)) || Number(values.depositAmount) < 0)) nextErrors.depositAmount = 'Zaklad summasi 0 dan kam bo‘lmasligi kerak'
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
      lastName: values.lastName,
      phone: values.phone,
      amount: Number.isFinite(amount) ? amount : 0,
      currencyId: values.currencyId || currencies.find((currency) => currency.isDefault)?.id || null,
      depositAmount: Number.isFinite(depositAmount) ? depositAmount : null,
      service: primaryProgramName || null,
      programs,
      stage: values.stage,
      address: values.address.trim() || null,
      latitude: Number.isFinite(latitudeValue) ? latitudeValue : null,
      longitude: Number.isFinite(longitudeValue) ? longitudeValue : null,
      ...(canManageGroups ? { groupIds: values.groupIds } : {}),
    }, null)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <div className="detail-grid">
        <FormField label="Ism" required error={errors.firstName}><Input value={values.firstName} onChange={set('firstName')} error={!!errors.firstName} disabled={loading} autoFocus={!isEditing} /></FormField>
        <FormField label="Familiya"><Input value={values.lastName} onChange={set('lastName')} disabled={loading} /></FormField>
        <FormField label="Telefon" required error={errors.phone}><Input type="tel" value={values.phone} onChange={handlePhone} error={!!errors.phone} disabled={loading} placeholder="+998 90 123 45 67" /></FormField>
        <FormField label="Savdo summasi" hint="Mijoz buyurtmasining umumiy qiymati" error={errors.amount}><Input type="number" min="0" step="0.01" value={values.amount} onChange={set('amount')} error={!!errors.amount} disabled={loading} placeholder="10 000 000" /></FormField>
        <FormField label="Valyuta"><Select value={values.currencyId || currencies.find((currency) => currency.isDefault)?.id || ''} onChange={set('currencyId')} disabled={loading || currencies.length === 0}><option value="">Valyuta tanlanmagan</option>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} — {currency.name}</option>)}</Select></FormField>
      </div>
      <div className="detail-grid">
        <FormField label="Dastur/xizmat"><Input value={values.programName} onChange={set('programName')} disabled={loading} placeholder="Masalan: Bito POS" /></FormField>
         {/* Stage changes are deliberately made from the Kanban drag action so
             deposit/follow-up/installation prompts cannot be bypassed here. */}
        {isEditing && <FormField label="Zaklad summasi" hint="Ixtiyoriy" error={errors.depositAmount}><Input type="number" min="0" step="1000" value={values.depositAmount} onChange={set('depositAmount')} error={!!errors.depositAmount} disabled={loading} placeholder="2 000 000" /></FormField>}
      </div>
      <LocationField values={values} setValue={setValue} loading={loading} />
      {canManageGroups && <FormField label="Guruh" hint="Bir nechta guruh tanlash mumkin"><Select multiple size={Math.min(4, Math.max(2, groups.length))} value={values.groupIds} onChange={setGroups} disabled={loading}><option value="" disabled>Guruh tanlang</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</Select></FormField>}
      <div className="card__footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        {onDelete && <Button type="button" variant="danger-ghost" onClick={onDelete} disabled={loading}>O‘chirish</Button>}
        <span style={{ flex: 1 }} />
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Bekor qilish</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
