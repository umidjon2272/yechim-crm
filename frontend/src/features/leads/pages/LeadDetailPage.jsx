import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLead } from '../leads.hooks'
import { leadsService } from '../../../services/leads.service'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { LeadForm } from '../components/LeadForm'
import { LeadStatusBadge } from '../components/LeadStatusBadge'
import { ConvertToDealForm } from '../components/ConvertToDealForm'
import { LEAD_SOURCE_LABELS, INTEREST_LEVEL_LABELS, LEAD_CONVERTIBLE_STATUSES } from '../leads.constants'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Modal } from '../../../components/Modal/Modal'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { CommentsSection } from '../../comments/CommentsSection'
import { ScheduleFollowUpButton } from '../../tasks/components/ScheduleFollowUpButton'
import { useAction } from '../../../hooks/useAction'
import { useToast } from '../../../store/ToastContext'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { formatDate } from '../../../utils/formatDate'

export function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const toast = useToast()
  const convertModal = useDisclosure()

  const { data: lead, loading, error, refetch } = useLead(id)
  const updateAction = useAction((values) => leadsService.update(id, values))
  const convertAction = useAction((payload) => leadsService.convertToDeal(id, payload))
  const [customers, setCustomers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    customersService.list({ pageSize: 100 }).then((res) => setCustomers(res?.items ?? [])).catch(() => setCustomers([]))
    businessesService.list({ pageSize: 100 }).then((res) => setBusinesses(res?.items ?? [])).catch(() => setBusinesses([]))
  }, [isEditing])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('Murojaat yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleConvert = async (payload) => {
    try {
      const result = await convertAction.run(payload)
      toast.success('Murojaat savdoga aylantirildi')
      convertModal.close()
      refetch()
      if (result?.dealId || result?.id) {
        navigate(`/admin/crm/deals/${result.dealId || result.id}`)
      }
    } catch (err) {
      toast.error(err.message || 'Savdoga aylantirishda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <Alert variant="danger" title="Murojaat topilmadi">
        {error?.message || 'Bu murojaat mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  const canConvert = LEAD_CONVERTIBLE_STATUSES.includes(lead.status) && !lead.dealId

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{lead.title}</h2>
          <p className="page-header__subtitle">
            <LeadStatusBadge status={lead.status} />
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/leads')}>
            Ortga
          </Button>
          <ScheduleFollowUpButton entityName={lead.title} context={{ leadId: id, customerId: lead.customer?.id }} />
          <PermissionGate permission="leads.edit">
            <Button variant="secondary" onClick={() => setSearchParams({ edit: '1' })}>
              Tahrirlash
            </Button>
          </PermissionGate>
          <PermissionGate permission="deals.create">
            {canConvert && (
              <Button onClick={convertModal.open}>Savdoga aylantirish</Button>
            )}
          </PermissionGate>
        </div>
      </div>

      {lead.dealId && (
        <Alert variant="info">
          Bu murojaat allaqachon savdoga aylantirilgan.{' '}
          <button type="button" className="dropdown__item" style={{ width: 'auto', padding: 0, display: 'inline' }} onClick={() => navigate(`/admin/crm/deals/${lead.dealId}`)}>
            Savdoni ko‘rish →
          </button>
        </Alert>
      )}

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <LeadForm
            initialValues={lead}
            customers={customers}
            businesses={businesses}
            employees={employees}
            submitLabel="Saqlash"
            loading={updateAction.loading}
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <div className="detail-grid">
          <Card title="Umumiy ma'lumot">
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field__label">Mijoz</div>
                <div className="detail-field__value">{lead.customer?.name || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Biznes</div>
                <div className="detail-field__value">{lead.business?.name || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Manba</div>
                <div className="detail-field__value">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Qiziqish darajasi</div>
                <div className="detail-field__value">{INTEREST_LEVEL_LABELS[lead.interestLevel] || lead.interestLevel}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Mas'ul xodim</div>
                <div className="detail-field__value">{lead.assignedEmployee?.name || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Kutilayotgan summa</div>
                <div className="detail-field__value">{lead.expectedValue != null ? lead.expectedValue : '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Keyingi aloqa</div>
                <div className="detail-field__value">{formatDate(lead.nextFollowUpDate)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Yaratilgan sana</div>
                <div className="detail-field__value">{formatDate(lead.createdAt)}</div>
              </div>
            </div>
          </Card>
          <Card title="Ehtiyoj va mahsulot">
            <div className="detail-field">
              <div className="detail-field__label">Ehtiyoj / muammo</div>
              <div className="detail-field__value">{lead.need || '—'}</div>
            </div>
            <div className="detail-field" style={{ marginTop: 12 }}>
              <div className="detail-field__label">Qiziqqan mahsulot</div>
              <div className="detail-field__value">{lead.interestedProduct || '—'}</div>
            </div>
            {lead.notes && (
              <div className="detail-field" style={{ marginTop: 12 }}>
                <div className="detail-field__label">Izohlar</div>
                <div className="detail-field__value">{lead.notes}</div>
              </div>
            )}
          </Card>
        </div>
      )}

      <RelatedList
        title="Vazifalar"
        fetcher={() => leadsService.getTasks(id)}
        deps={[id]}
        renderItem={(item) => <span>{item.title}</span>}
        emptyHint="Bu murojaat bilan bog‘liq vazifa yo‘q."
      />

      <ActivitiesSection fetcher={() => leadsService.getActivities(id)} deps={[id]} context={{ leadId: id }} />

      <CommentsSection entityType="lead" entityId={id} />

      <Modal open={convertModal.isOpen} title="Savdoga aylantirish" onClose={convertModal.close}>
        <ConvertToDealForm lead={lead} employees={employees} loading={convertAction.loading} onSubmit={handleConvert} onCancel={convertModal.close} />
      </Modal>
    </div>
  )
}
