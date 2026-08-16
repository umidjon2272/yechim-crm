import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInstallations } from '../installations.hooks'
import { installationsService } from '../../../services/installations.service'
import { dealsService } from '../../../services/deals.service'
import { employeesService } from '../../../services/employees.service'
import { InstallationTable } from '../components/InstallationTable'
import { InstallationForm } from '../components/InstallationForm'
import { INSTALLATION_STATUSES, INSTALLATION_STATUS_LABELS } from '../installations.constants'
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

export function InstallationsListPage() {
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId') || ''
  const { installations, total, params, setStatus, setAssignedEmployeeId, setPage, loading, error, refetch } = useInstallations({ dealId })
  const { isOpen, open, close } = useDisclosure()
  const [deals, setDeals] = useState([])
  const [employees, setEmployees] = useState([])
  const toast = useToast()

  const createAction = useAction(installationsService.create)

  useEffect(() => {
    dealsService.list({ pageSize: 100 }).then((res) => setDeals(res?.items ?? [])).catch(() => setDeals([]))
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    if (dealId) open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId])

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('O‘rnatish rejalashtirildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'O‘rnatish rejalashtirishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">O‘rnatishlar</h2>
          <p className="page-header__subtitle">O‘rnatishlar</p>
        </div>
        <PermissionGate permission="installations.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi o‘rnatish
          </Button>
        </PermissionGate>
      </div>

      <div className="filters-row">
        <Select value={params.status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Barcha holatlar</option>
          {INSTALLATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {INSTALLATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={params.assignedEmployeeId} onChange={(e) => setAssignedEmployeeId(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Barcha xodimlar</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="danger" title="O‘rnatishlarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && installations.length === 0 && (
        <EmptyState icon={<InboxIcon width={22} height={22} />} title="O‘rnatishlar topilmadi" description="Hozircha o‘rnatish rejalashtirilmagan." />
      )}

      {!loading && !error && installations.length > 0 && (
        <>
          <InstallationTable installations={installations} />
          <Pagination page={params.page} pageSize={params.pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal open={isOpen} title="Yangi o‘rnatish rejalashtirish" onClose={close}>
        <InstallationForm
          initialValues={dealId ? { dealId } : undefined}
          lockDeal={!!dealId}
          deals={deals}
          employees={employees}
          submitLabel="Rejalashtirish"
          loading={createAction.loading}
          onSubmit={handleCreate}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
