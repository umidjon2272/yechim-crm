import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBusinesses } from '../businesses.hooks'
import { businessesService } from '../../../services/businesses.service'
import { customersService } from '../../../services/customers.service'
import { employeesService } from '../../../services/employees.service'
import { BusinessTable } from '../components/BusinessTable'
import { BusinessForm } from '../components/BusinessForm'
import { BUSINESS_STATUSES, BUSINESS_STATUS_LABELS } from '../businesses.constants'
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
import { BuildingIcon, PlusIcon, SearchIcon } from '../../../components/icons/Icons'

export function BusinessesListPage() {
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId') || ''
  const { businesses, total, params, setSearch, setStatus, setPage, loading, error, refetch } = useBusinesses({ customerId })
  const { isOpen, open, close } = useDisclosure()
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const toast = useToast()

  const createAction = useAction(businessesService.create)

  useEffect(() => {
    customersService
      .list({ pageSize: 100 })
      .then((res) => setCustomers(res?.items ?? []))
      .catch(() => setCustomers([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Biznes qo‘shildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Biznes qo‘shishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Bizneslar</h2>
          <p className="page-header__subtitle">Mijozlarning kompaniya/do‘kon/restoranlari</p>
        </div>
        <PermissionGate permission="businesses.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi biznes
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <div className="input-group filters-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Biznes nomi bo‘yicha qidirish" value={params.search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {BUSINESS_STATUSES.map((status) => (
            <option key={status} value={status}>
              {BUSINESS_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="Bizneslarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && businesses.length === 0 && (
        <EmptyState icon={<BuildingIcon width={22} height={22} />} title="Bizneslar topilmadi" description="Hozircha biznes qo‘shilmagan." />
      )}

      {!loading && !error && businesses.length > 0 && (
        <>
          <BusinessTable businesses={businesses} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi biznes qo‘shish" onClose={close}>
        <BusinessForm
          initialValues={customerId ? { customerId } : undefined}
          customers={customers}
          employees={employees}
          submitLabel="Qo‘shish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
