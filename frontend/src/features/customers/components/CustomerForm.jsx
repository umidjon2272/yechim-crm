import { useState } from 'react'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Select } from '../../../components/Select/Select'
import { Button } from '../../../components/Button/Button'
import { useAsync } from '../../../hooks/useAsync'
import { customerFieldDefsService } from '../../../services/customers.service'
import { validate, rules } from '../../../utils/validators'
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABELS, CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS } from '../customers.constants'
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from '../../leads/leads.constants'
import { ChevronDownIcon } from '../../../components/icons/Icons'
import { classNames } from '../../../utils/classNames'
import './CustomerForm.scss'

const DEFAULT_ADDRESS = { country: '', region: '', city: '', district: '', street: '', house: '', extra: '', lat: '', lng: '' }

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  phone2: '',
  telegram: '',
  email: '',
  programName: '',
  amount: '',
  address: DEFAULT_ADDRESS,
  businessName: '',
  businessType: '',
  businessPhone: '',
  businessAddress: '',
  birthDate: '',
  notes: '',
  telegramUsername: '',
  instagram: '',
  source: '',
  assignedEmployeeId: '',
  status: 'active',
  stage: 'NEW',
  customFields: {},
}

function splitName(name = '') {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

function CollapsibleSection({ title, hint, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="customer-form-section">
      <button type="button" className="customer-form-section__toggle" onClick={() => setOpen((v) => !v)}>
        <span>
          {title}
          {hint && <span className="text-muted text-xs" style={{ marginLeft: 8, fontWeight: 400 }}>{hint}</span>}
        </span>
        <ChevronDownIcon width={14} height={14} className={classNames('customer-form-section__chevron', open && 'customer-form-section__chevron--open')} />
      </button>
      {open && <div className="customer-form-section__body">{children}</div>}
    </div>
  )
}

function CustomFieldInput({ def, value, onChange }) {
  if (def.type === 'BOOLEAN') {
    return (
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tanlanmagan</option>
        <option value="true">Ha</option>
        <option value="false">Yo‘q</option>
      </Select>
    )
  }
  if (def.type === 'SELECT') {
    return (
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tanlanmagan</option>
        {(def.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    )
  }
  const inputType = { NUMBER: 'number', DATE: 'date', PHONE: 'tel' }[def.type] || 'text'
  return <Input type={inputType} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
}

// Employees/customFieldDefs are Drawer-scoped: this form is only ever
// rendered inside the "+ Mijoz qo'shish" drawer, so it's fine to fetch
// custom field definitions itself rather than threading them through props.
export function CustomerForm({
  initialValues,
  employees = [],
  stages = CUSTOMER_STAGES.map((stage) => ({ id: stage, label: CUSTOMER_STAGE_LABELS[stage] })),
  submitLabel = 'Saqlash',
  loading,
  onSubmit,
  onCancel,
}) {
  const { data: fieldDefsData } = useAsync(() => customerFieldDefsService.list({ pageSize: 100 }), [])
  const fieldDefs = fieldDefsData?.items ?? []

  const seed = initialValues
    ? {
        ...DEFAULT_VALUES,
        ...splitName(initialValues.name),
        ...initialValues,
        programName: initialValues.programs?.[0]?.name || '',
        amount: initialValues.amount ?? '',
        address: { ...DEFAULT_ADDRESS, ...initialValues.address },
        customFields: { ...initialValues.customFields },
      }
    : DEFAULT_VALUES
  const [values, setValues] = useState(seed)
  const [errors, setErrors] = useState({})

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }))
  const setAddress = (field) => (event) => setValues((v) => ({ ...v, address: { ...v.address, [field]: event.target.value } }))
  const setCustomField = (defId) => (value) => setValues((v) => ({ ...v, customFields: { ...v.customFields, [defId]: value } }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      firstName: [rules.required('Ism kiritilishi shart')],
      phone: [rules.required('Telefon kiritilishi shart')],
      email: [rules.email()],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const {
      firstName, lastName, businessName, businessType, businessPhone, businessAddress, programName,
      ...rest
    } = values
    const amount = rest.amount === '' || rest.amount == null ? 0 : Number(rest.amount)
    const existingPrograms = Array.isArray(values.programs) ? values.programs : []
    const primaryProgramName = programName.trim()
    const programs = primaryProgramName
      ? [
          {
            ...(existingPrograms[0] || {}),
            name: primaryProgramName,
            status: existingPrograms[0]?.status || 'NEW',
          },
          ...existingPrograms.slice(1),
        ]
      : existingPrograms
    const customerPayload = { ...rest, amount: Number.isFinite(amount) ? amount : 0, programs, name: `${firstName} ${lastName}`.trim() }
    const businessPayload = businessName.trim()
      ? { name: businessName, businessType, phone: businessPhone, address: businessAddress, city: values.address.city }
      : null

    onSubmit(customerPayload, businessPayload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <div className="detail-grid">
        <FormField label="Ism" required error={errors.firstName}>
          <Input value={values.firstName} onChange={set('firstName')} error={!!errors.firstName} disabled={loading} />
        </FormField>
        <FormField label="Familiya">
          <Input value={values.lastName} onChange={set('lastName')} disabled={loading} />
        </FormField>
        <FormField label="Telefon" required error={errors.phone}>
          <Input value={values.phone} onChange={set('phone')} error={!!errors.phone} disabled={loading} />
        </FormField>
        <FormField label="Dastur/xizmat">
          <Input value={values.programName} onChange={set('programName')} disabled={loading} placeholder="Masalan: Bito POS" />
        </FormField>
        <FormField label="Savdo summasi">
          <Input type="number" min="0" step="1000" value={values.amount} onChange={set('amount')} disabled={loading} placeholder="5000000" />
        </FormField>
        <FormField label="Mas'ul xodim">
          <Select value={values.assignedEmployeeId} onChange={set('assignedEmployeeId')} disabled={loading}>
            <option value="">Tanlanmagan</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Bosqich">
          <Select value={values.stage} onChange={set('stage')} disabled={loading}>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Izoh">
          <Input value={values.notes} onChange={set('notes')} disabled={loading} />
        </FormField>
        <FormField label="Qo‘shimcha telefon">
          <Input value={values.phone2} onChange={set('phone2')} disabled={loading} />
        </FormField>
        <FormField label="Telegram">
          <Input value={values.telegram} onChange={set('telegram')} disabled={loading} placeholder="@username" />
        </FormField>
        <FormField label="Elektron pochta" error={errors.email}>
          <Input type="email" value={values.email} onChange={set('email')} error={!!errors.email} disabled={loading} />
        </FormField>
      </div>

      <CollapsibleSection title="Manzil">
        <div className="detail-grid">
          <FormField label="Davlat">
            <Input value={values.address.country} onChange={setAddress('country')} disabled={loading} />
          </FormField>
          <FormField label="Viloyat">
            <Input value={values.address.region} onChange={setAddress('region')} disabled={loading} />
          </FormField>
          <FormField label="Shahar">
            <Input value={values.address.city} onChange={setAddress('city')} disabled={loading} />
          </FormField>
          <FormField label="Tuman">
            <Input value={values.address.district} onChange={setAddress('district')} disabled={loading} />
          </FormField>
          <FormField label="Ko‘cha">
            <Input value={values.address.street} onChange={setAddress('street')} disabled={loading} />
          </FormField>
          <FormField label="Uy">
            <Input value={values.address.house} onChange={setAddress('house')} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Qo‘shimcha manzil">
          <Input value={values.address.extra} onChange={setAddress('extra')} disabled={loading} />
        </FormField>
        <div className="detail-grid">
          <FormField label="Kenglik (lat)" hint="Xarita integratsiyasi uchun tayyor maydon">
            <Input value={values.address.lat} onChange={setAddress('lat')} disabled={loading} placeholder="41.311081" />
          </FormField>
          <FormField label="Uzunlik (lng)">
            <Input value={values.address.lng} onChange={setAddress('lng')} disabled={loading} placeholder="69.240562" />
          </FormField>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Mijozga tegishli biznes" hint="ixtiyoriy">
        <div className="detail-grid">
          <FormField label="Biznes nomi">
            <Input value={values.businessName} onChange={set('businessName')} disabled={loading} />
          </FormField>
          <FormField label="Biznes turi">
            <Input value={values.businessType} onChange={set('businessType')} disabled={loading} placeholder="Restoran, do‘kon..." />
          </FormField>
          <FormField label="Biznes telefoni">
            <Input value={values.businessPhone} onChange={set('businessPhone')} disabled={loading} />
          </FormField>
          <FormField label="Biznes manzili">
            <Input value={values.businessAddress} onChange={set('businessAddress')} disabled={loading} />
          </FormField>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Qo‘shimcha ma'lumotlar">
        <div className="detail-grid">
          <FormField label="Tug‘ilgan sana">
            <Input type="date" value={values.birthDate} onChange={set('birthDate')} disabled={loading} />
          </FormField>
          <FormField label="Telegram username">
            <Input value={values.telegramUsername} onChange={set('telegramUsername')} disabled={loading} />
          </FormField>
          <FormField label="Instagram">
            <Input value={values.instagram} onChange={set('instagram')} disabled={loading} />
          </FormField>
          <FormField label="Mijoz manbasi">
            <Select value={values.source} onChange={set('source')} disabled={loading}>
              <option value="">Tanlanmagan</option>
              {LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {LEAD_SOURCE_LABELS[source]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Holat">
            <Select value={values.status} onChange={set('status')} disabled={loading}>
              {CUSTOMER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CUSTOMER_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </FormField>
          {fieldDefs.map((def) => (
            <FormField key={def.id} label={def.label}>
              <CustomFieldInput def={def} value={values.customFields[def.id]} onChange={setCustomField(def.id)} />
            </FormField>
          ))}
        </div>
      </CollapsibleSection>

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
