import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePayments } from '../payments.hooks'
import { paymentsService } from '../../../services/payments.service'
import { dealsService } from '../../../services/deals.service'
import { PaymentTable } from '../components/PaymentTable'
import { PaymentForm } from '../components/PaymentForm'
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../payments.constants'
import { Button } from '../../../components/Button/Button'
import { Select } from '../../../components/Select/Select'
import { Modal } from '../../../components/Modal/Modal'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Pagination } from '../../../components/Pagination/Pagination'
import { PermissionGate } from '../../roles/PermissionGate'
import { useToast } from '../../../store/ToastContext'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { InboxIcon, PlusIcon } from '../../../components/icons/Icons'

export function PaymentsListPage() {
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId') || ''
  const { payments, total, params, setStatus, setMethod, setPage, loading, error, refetch } = usePayments({ dealId })
  const { isOpen, open, close } = useDisclosure()
  const [deals, setDeals] = useState([])
  const toast = useToast()

  const createAction = useAction(paymentsService.create)

  useEffect(() => {
    dealsService.list({ pageSize: 100 }).then((res) => setDeals(res?.items ?? [])).catch(() => setDeals([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('To‘lov qayd etildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'To‘lov qayd etishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">To‘lovlar</h2>
          <p className="page-header__subtitle">To‘lovlar tarixi</p>
        </div>
        <PermissionGate permission="payments.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi to‘lov
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PAYMENT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={params.method} onChange={(e) => setMethod(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha usullar</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="To‘lovlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="To‘lovlar topilmadi" description="Hozircha to‘lov qayd etilmagan." />
      )}

      {!loading && !error && payments.length > 0 && (
        <>
          <PaymentTable payments={payments} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi to‘lov qayd etish" onClose={close}>
        <PaymentForm
          deals={deals}
          submitLabel="Saqlash"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
