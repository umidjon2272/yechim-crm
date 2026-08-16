import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBusiness } from '../businesses.hooks'
import { businessesService } from '../../../services/businesses.service'
import { customersService } from '../../../services/customers.service'
import { employeesService } from '../../../services/employees.service'
import { BusinessForm } from '../components/BusinessForm'
import { BUSINESS_STATUS_LABELS } from '../businesses.constants'
import { PAYMENT_STATUS_LABELS } from '../../payments/payments.constants'
import { INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import { Card } from '../../../components/Card/Card'
import { Badge } from '../../../components/Badge/Badge'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { PermissionGate } from '../../roles/PermissionGate'
import { ActivitiesSection } from '../../activities/ActivitiesSection'
import { CommentsSection } from '../../comments/CommentsSection'
import { AttachmentsSection } from '../../attachments/AttachmentsSection'
import { useAction } from '../../../hooks/useAction'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../store/ToastContext'

/**
 * Total Deal Value / Paid / Remaining, computed client-side from this
 * business's deals + payments — same display-only pattern and disclaimer as
 * DealDetailPage's PaymentsSummary. Backend remains the source of truth.
 */
function BusinessRevenueSummary({ businessId }) {
  const { data: dealsData, loading: dealsLoading } = useAsync(() => businessesService.getDeals(businessId), [businessId])
  const { data: paymentsData, loading: paymentsLoading } = useAsync(() => businessesService.getPayments(businessId), [businessId])

  const deals = dealsData?.items ?? dealsData ?? []
  const payments = paymentsData?.items ?? paymentsData ?? []
  const totalDealValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0)
  const paid = payments
    .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const remaining = Math.max(0, totalDealValue - paid)
  const loading = dealsLoading || paymentsLoading

  return (
    <Card title="Tushum">
      {loading ? (
        <div className="page-loading">
          <Spinner />
        </div>
      ) : (
        <div className="deal-totals">
          <div className="deal-totals__row">
            <span>Savdolar jami qiymati</span>
            <span>{totalDealValue}</span>
          </div>
          <div className="deal-totals__row">
            <span>To‘langan</span>
            <span>{paid}</span>
          </div>
          <div className="deal-totals__row deal-totals__row--grand">
            <span>Qolgan</span>
            <span>{remaining}</span>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>
            Ko‘rsatish uchun frontendda hisoblanadi — real moliyaviy holat backendda saqlanadi.
          </p>
        </div>
      )}
    </Card>
  )
}

export function BusinessDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const toast = useToast()

  const { data: business, loading, error, refetch } = useBusiness(id)
  const updateAction = useAction((values) => businessesService.update(id, values))
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    if (!isEditing) return
    customersService.list({ pageSize: 100 }).then((res) => setCustomers(res?.items ?? [])).catch(() => setCustomers([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [isEditing])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('Biznes ma’lumotlari yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !business) {
    return (
      <Alert variant="danger" title="Biznes topilmadi">
        {error?.message || 'Bu biznes mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{business.name}</h2>
          <p className="page-header__subtitle">
            <Badge variant={business.status === 'active' ? 'success' : 'gray'}>
              {BUSINESS_STATUS_LABELS[business.status] || business.status}
            </Badge>
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/businesses')}>
            Ortga
          </Button>
          <PermissionGate permission="businesses.edit">
            <Button onClick={() => setSearchParams({ edit: '1' })}>Tahrirlash</Button>
          </PermissionGate>
        </div>
      </div>

      {isEditing ? (
        <Card title="Ma'lumotlarni tahrirlash">
          <BusinessForm
            initialValues={business}
            customers={customers}
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
                <div className="detail-field__label">Biznes turi</div>
                <div className="detail-field__value">{business.businessType || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Telefon</div>
                <div className="detail-field__value">{business.phone || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Elektron pochta</div>
                <div className="detail-field__value">{business.email || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Manzil</div>
                <div className="detail-field__value">
                  {business.address || '—'}{business.city ? `, ${business.city}` : ''}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field__label">Mas'ul xodim</div>
                <div className="detail-field__value">{business.assignedEmployee?.name || '—'}</div>
              </div>
            </div>
            {business.notes && (
              <div className="detail-field" style={{ marginTop: 16 }}>
                <div className="detail-field__label">Izohlar</div>
                <div className="detail-field__value">{business.notes}</div>
              </div>
            )}
          </Card>
          <Card title="Mijoz">
            {business.customer ? (
              <button
                type="button"
                className="dropdown__item"
                style={{ width: 'auto', padding: 0 }}
                onClick={() => navigate(`/admin/crm/customers/${business.customer.id}`)}
              >
                {business.customer.name}
              </button>
            ) : (
              '—'
            )}
          </Card>
          <BusinessRevenueSummary businessId={id} />
        </div>
      )}

      <div className="detail-grid">
        <RelatedList
          title="Murojaatlar"
          fetcher={() => businessesService.getLeads(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/leads/${item.id}`}
          renderItem={(item) => <span>{item.title}</span>}
          emptyHint="Bu biznes uchun hali murojaat yaratilmagan."
        />
        <RelatedList
          title="Savdolar"
          fetcher={() => businessesService.getDeals(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/deals/${item.id}`}
          renderItem={(item) => <span>{item.name}</span>}
          emptyHint="Bu biznes uchun hali savdo yaratilmagan."
        />
        <RelatedList
          title="Mahsulotlar"
          fetcher={() => businessesService.getProducts(id)}
          deps={[id]}
          renderItem={(item) => <span>{item.name} × {item.quantity}</span>}
          emptyHint="Bu biznesga hali mahsulot sotilmagan yoki o‘rnatilmagan."
        />
        <RelatedList
          title="To‘lovlar"
          fetcher={() => businessesService.getPayments(id)}
          deps={[id]}
          renderItem={(item) => <span>{item.amount} — {PAYMENT_STATUS_LABELS[item.status] || item.status}</span>}
          emptyHint="Bu biznes uchun hali to‘lov qayd etilmagan."
        />
        <RelatedList
          title="O‘rnatishlar"
          fetcher={() => businessesService.getInstallations(id)}
          deps={[id]}
          linkTo={(item) => `/admin/crm/installations/${item.id}`}
          renderItem={(item) => <span>{INSTALLATION_STATUS_LABELS[item.status] || item.status}</span>}
          emptyHint="Bu biznes uchun hali o‘rnatish rejalashtirilmagan."
        />
      </div>

      <ActivitiesSection fetcher={() => businessesService.getActivities(id)} deps={[id]} context={{ businessId: id }} />

      <div className="detail-grid">
        <CommentsSection entityType="business" entityId={id} />
        <AttachmentsSection entityType="business" entityId={id} />
      </div>
    </div>
  )
}
