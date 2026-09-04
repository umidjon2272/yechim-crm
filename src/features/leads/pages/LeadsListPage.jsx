import { useEffect, useState } from 'react'
import { useLeads } from '../leads.hooks'
import { leadsService } from '../../../services/leads.service'
import { customersService } from '../../../services/customers.service'
import { businessesService } from '../../../services/businesses.service'
import { employeesService } from '../../../services/employees.service'
import { LeadTable } from '../components/LeadTable'
import { LeadForm } from '../components/LeadForm'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCES, LEAD_SOURCE_LABELS } from '../leads.constants'
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

export function LeadsListPage() {
  const { leads, total, params, setSearch, setStatus, setSource, setPage, loading, error, refetch } = useLeads()
  const { isOpen, open, close } = useDisclosure()
  const [customers, setCustomers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [employees, setEmployees] = useState([])
  const toast = useToast()

  const createAction = useAction(leadsService.create)

  useEffect(() => {
    customersService.list({ pageSize: 100 }).then((res) => setCustomers(res?.items ?? [])).catch(() => setCustomers([]))
    businessesService.list({ pageSize: 100 }).then((res) => setBusinesses(res?.items ?? [])).catch(() => setBusinesses([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Murojaat qo‘shildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Murojaat qo‘shishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Murojaatlar</h2>
          <p className="page-header__subtitle">Potentsial mijozlar bilan ishlash</p>
        </div>
        <PermissionGate permission="leads.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi murojaat
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <div className="input-group filters-row__search">
          <span className="input-group__icon">
            <SearchIcon width={16} height={16} />
          </span>
          <Input placeholder="Murojaat sarlavhasi bo‘yicha qidirish" value={params.search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={params.source} onChange={(e) => setSource(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha manbalar</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {LEAD_SOURCE_LABELS[source]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="Murojaatlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="Murojaatlar topilmadi" description="Hozircha murojaat qo‘shilmagan." />
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <LeadTable leads={leads} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi murojaat qo‘shish" onClose={close}>
        <LeadForm
          customers={customers}
          businesses={businesses}
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
