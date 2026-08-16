import { useNavigate, useParams } from 'react-router-dom'
import { useQuotation } from '../quotations.hooks'
import { quotationsService } from '../../../services/quotations.service'
import { dealsService } from '../../../services/deals.service'
import { QuotationStatusBadge } from '../components/QuotationStatusBadge'
import { QUOTATION_STATUS_LABELS } from '../quotations.constants'
import './QuotationDetailPage.scss'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAsync } from '../../../hooks/useAsync'
import { useAction } from '../../../hooks/useAction'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { formatDate } from '../../../utils/formatDate'

export function QuotationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()

  const { data: quotation, loading, error, refetch } = useQuotation(id)
  const { data: itemsData } = useAsync(() => (quotation?.dealId ? dealsService.listItems(quotation.dealId) : Promise.resolve(null)), [quotation?.dealId])
  const sendAction = useAction(() => quotationsService.send(id))
  const acceptAction = useAction(() => quotationsService.accept(id))
  const rejectAction = useAction(() => quotationsService.reject(id))

  const items = itemsData?.items ?? itemsData ?? []
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
  const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0)

  const runTransition = async (action, title, description, successMessage) => {
    const ok = await confirm({ title, description })
    if (!ok) return
    try {
      await action.run()
      toast.success(successMessage)
      refetch()
    } catch (err) {
      toast.error(err.message || 'Amalni bajarishda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <Alert variant="danger" title="Taklifnoma topilmadi">
        {error?.message || 'Bu taklifnoma mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  return (
    <div className="stack">
      <div className="page-header no-print">
        <div>
          <h2 className="page-header__title">Taklifnoma #{quotation.number}</h2>
          <p className="page-header__subtitle">
            <QuotationStatusBadge status={quotation.status} />
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/crm/quotations')}>
            Ortga
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Chop etish / Yuklab olish
          </Button>
          <PermissionGate permission="quotations.edit">
            {quotation.status === 'DRAFT' && (
              <Button
                loading={sendAction.loading}
                onClick={() => runTransition(sendAction, 'Yuborish', 'Taklifnoma mijozga yuborilsinmi?', 'Taklifnoma yuborildi')}
              >
                Yuborish
              </Button>
            )}
            {quotation.status === 'SENT' && (
              <>
                <Button
                  loading={acceptAction.loading}
                  onClick={() => runTransition(acceptAction, 'Qabul qilish', 'Taklifnoma qabul qilingan deb belgilansinmi?', 'Taklifnoma qabul qilindi')}
                >
                  Qabul qilish
                </Button>
                <Button
                  variant="danger"
                  loading={rejectAction.loading}
                  onClick={() => runTransition(rejectAction, 'Rad etish', 'Taklifnoma rad etilgan deb belgilansinmi?', 'Taklifnoma rad etildi')}
                >
                  Rad etish
                </Button>
              </>
            )}
          </PermissionGate>
        </div>
      </div>

      {/* Real PDF generation is a backend requirement (server-rendered or emailed) —
          this is a print-friendly view using the browser's native print/save-as-PDF. */}
      <div className="quotation-print">
        <div className="quotation-print__header">
          <div>
            <div className="quotation-print__brand">YECHIM</div>
            <div className="text-muted text-xs">Taklifnoma #{quotation.number}</div>
          </div>
          <div className="quotation-print__meta">
            <div>Sana: {formatDate(quotation.createdAt)}</div>
            <div>Amal qilish muddati: {formatDate(quotation.validUntil)}</div>
            <div>Holat: {QUOTATION_STATUS_LABELS[quotation.status] || quotation.status}</div>
          </div>
        </div>

        <div className="detail-grid">
          <Card title="Mijoz ma'lumotlari">
            <div className="detail-field__value">{quotation.customer?.name || '—'}</div>
            <div className="text-muted text-xs">{quotation.customer?.phone}</div>
            <div className="text-muted text-xs">{quotation.customer?.email}</div>
          </Card>
          <Card title="Biznes ma'lumotlari">
            <div className="detail-field__value">{quotation.business?.name || '—'}</div>
            <div className="text-muted text-xs">{quotation.business?.address}</div>
          </Card>
        </div>

        <Card title="Mahsulotlar">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Miqdori</th>
                  <th>Narxi</th>
                  <th>Chegirma</th>
                  <th>Jami</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice}</td>
                    <td>{item.discount || 0}</td>
                    <td>{item.total ?? Number(item.quantity || 0) * Number(item.unitPrice || 0) - Number(item.discount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="deal-totals">
            <div className="deal-totals__row">
              <span>Oraliq summa</span>
              <span>{subtotal}</span>
            </div>
            <div className="deal-totals__row">
              <span>Chegirma</span>
              <span>-{discount}</span>
            </div>
            <div className="deal-totals__row deal-totals__row--grand">
              <span>Umumiy summa</span>
              <span>{quotation.total ?? Math.max(0, subtotal - discount)}</span>
            </div>
          </div>
        </Card>

        {quotation.notes && (
          <Card title="Izohlar">
            <p>{quotation.notes}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
