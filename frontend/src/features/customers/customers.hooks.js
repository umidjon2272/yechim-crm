import { useCallback, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { customersService } from '../../services/customers.service'

const VIEW_STORAGE_KEY = 'bold-yechim-customers-view'
const VALID_VIEWS = ['list', 'kanban']
const KANBAN_PAGE_SIZE = 200

function loadStoredView() {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    return VALID_VIEWS.includes(stored) ? stored : 'kanban'
  } catch {
    return 'kanban'
  }
}

export function useCustomers() {
  const [view, setViewState] = useState(loadStoredView)
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    stage: '',
    assignedEmployeeId: '',
    city: '',
    program: '',
    groupId: '',
    installationStatus: '',
    createdFrom: '',
    createdTo: '',
    sort: '-createdAt',
  })

  // Kanban needs every customer on the board at once (grouped client-side
  // by stage), not one paginated page — same pattern as useDeals's Kanban.
  const listQuery = useAsync(
    () => (view !== 'kanban' ? customersService.list(params) : Promise.resolve(null)),
    [
      view, params.page, params.pageSize, params.search, params.status, params.stage, params.assignedEmployeeId,
      params.city, params.program, params.groupId, params.installationStatus,
      params.createdFrom, params.createdTo, params.sort,
    ]
  )
  const kanbanQuery = useAsync(
    () => {
      const kanbanParams = {
        search: params.search,
        status: params.status,
        assignedEmployeeId: params.assignedEmployeeId,
        city: params.city,
        program: params.program,
        groupId: params.groupId,
        installationStatus: params.installationStatus,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
        sort: params.sort,
      }
      return view === 'kanban' ? loadKanbanCustomers(kanbanParams) : Promise.resolve(null)
    },
    [view, params.search, params.status, params.assignedEmployeeId, params.city, params.program, params.groupId, params.installationStatus, params.createdFrom, params.createdTo, params.sort]
  )
  const active = view === 'kanban' ? kanbanQuery : listQuery

  const setView = useCallback((next) => {
    setViewState(next)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // Storage unavailable — the choice just won't persist across reloads.
    }
  }, [])

  const setSearch = useCallback((search) => setParams((p) => ({ ...p, search, page: 1 })), [])
  const setStatus = useCallback((status) => setParams((p) => ({ ...p, status, page: 1 })), [])
  const setStage = useCallback((stage) => setParams((p) => ({ ...p, stage, page: 1 })), [])
  const setAssignedEmployeeId = useCallback((assignedEmployeeId) => setParams((p) => ({ ...p, assignedEmployeeId, page: 1 })), [])
  const setCity = useCallback((city) => setParams((p) => ({ ...p, city, page: 1 })), [])
  const setProgram = useCallback((program) => setParams((p) => ({ ...p, program, page: 1 })), [])
  const setGroupId = useCallback((groupId) => setParams((p) => ({ ...p, groupId, page: 1 })), [])
  const setInstallationStatus = useCallback((installationStatus) => setParams((p) => ({ ...p, installationStatus, page: 1 })), [])
  const setCreatedFrom = useCallback((createdFrom) => setParams((p) => ({ ...p, createdFrom, page: 1 })), [])
  const setCreatedTo = useCallback((createdTo) => setParams((p) => ({ ...p, createdTo, page: 1 })), [])
  const setSort = useCallback((sort) => setParams((p) => ({ ...p, sort, page: 1 })), [])
  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), [])

  return {
    view,
    setView,
    customers: active.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    params,
    setSearch,
    setStatus,
    setStage,
    setAssignedEmployeeId,
    setCity,
    setProgram,
    setGroupId,
    setInstallationStatus,
    setCreatedFrom,
    setCreatedTo,
    setSort,
    setPage,
    loading: active.loading,
    error: active.error,
    refetch: active.refetch,
  }
}

async function loadKanbanCustomers(params) {
  const firstPage = await customersService.list({ ...params, page: 1, pageSize: KANBAN_PAGE_SIZE })
  const items = [...(firstPage?.items ?? [])]
  const total = Number(firstPage?.total ?? items.length)
  const pageSize = Number(firstPage?.pageSize ?? KANBAN_PAGE_SIZE) || KANBAN_PAGE_SIZE
  const pageCount = Math.ceil(total / pageSize)

  for (let page = 2; page <= pageCount; page += 1) {
    const nextPage = await customersService.list({ ...params, page, pageSize })
    items.push(...(nextPage?.items ?? []))
  }

  return { ...firstPage, items, total, page: 1, pageSize: items.length || pageSize }
}

export function useCustomer(id) {
  return useAsync(() => customersService.get(id), [id])
}
