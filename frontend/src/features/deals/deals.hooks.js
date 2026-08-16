import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { dealsService } from '../../services/deals.service'

export function useDeals() {
  const [view, setView] = useState('list')
  const [params, setParams] = useState({ page: 1, pageSize: 10, search: '', stage: '', salesEmployeeId: '', sort: '-createdAt' })

  // Kanban needs every deal on the board at once (grouped client-side by
  // stage), not one paginated page — so it fetches a much larger page size
  // and ignores the stage filter/pagination controls.
  const listQuery = useAsync(
    () => (view === 'list' ? dealsService.list(params) : Promise.resolve(null)),
    [view, params.page, params.pageSize, params.search, params.stage, params.salesEmployeeId, params.sort]
  )
  const kanbanQuery = useAsync(() => (view === 'kanban' ? dealsService.list({ pageSize: 200 }) : Promise.resolve(null)), [view])

  const active = view === 'list' ? listQuery : kanbanQuery

  return {
    view,
    setView,
    deals: active.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    params,
    setSearch: (search) => setParams((p) => ({ ...p, search, page: 1 })),
    setStage: (stage) => setParams((p) => ({ ...p, stage, page: 1 })),
    setSalesEmployeeId: (salesEmployeeId) => setParams((p) => ({ ...p, salesEmployeeId, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading: active.loading,
    error: active.error,
    refetch: active.refetch,
  }
}

export function useDeal(id) {
  return useAsync(() => dealsService.get(id), [id])
}

export function useDealItems(dealId) {
  return useAsync(() => dealsService.listItems(dealId), [dealId])
}
