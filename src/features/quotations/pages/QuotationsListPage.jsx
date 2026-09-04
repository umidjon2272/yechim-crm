import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuotations } from '../quotations.hooks'
import { quotationsService } from '../../../services/quotations.service'
import { dealsService } from '../../../services/deals.service'
import { QuotationTable } from '../components/QuotationTable'
import { QuotationForm } from '../components/QuotationForm'
import { QUOTATION_STATUSES, QUOTATION_STATUS_LABELS } from '../quotations.constants'
import { Button } from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
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
import { InboxIcon, PlusIcon, SearchIcon } from '../../../components/icons/Icons'

export function QuotationsListPage() {
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId') || ''
  const { quotations, total, params, setSearch, setStatus, setPage, loading, error, refetch } = useQuotations({ dealId })
  const { isOpen, open, close } = useDisclosure()
  const [deals, setDeals] = useState([])
  const toast = useToast()

  const createAction = useAction(quotationsService.create)

  useEffect(() => {
    dealsService.list({ pageSize: 100 }).then((res) => setDeals(res?.items ?? [])).catch(() => setDeals([]))
  }, [])

  useEffect(() => {
    if (dealId) open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Taklifnoma yaratildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Taklifnoma yaratishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Takliflar</h2>
          <p className="page-header__subtitle">Narx-navlar / taklifnomalar</p>
        </div>
        <PermissionGate permission="quotations.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi taklifnoma
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <div className="input-group filters-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Raqam bo‘yicha qidirish" value={params.search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {QUOTATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {QUOTATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="Taklifnomalarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && quotations.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="Taklifnomalar topilmadi" description="Hozircha taklifnoma yaratilmagan." />
      )}

      {!loading && !error && quotations.length > 0 && (
        <>
          <QuotationTable quotations={quotations} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi taklifnoma yaratish" onClose={close}>
        <QuotationForm
          initialValues={dealId ? { dealId } : undefined}
          lockDeal={!!dealId}
          deals={deals}
          submitLabel="Yaratish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
