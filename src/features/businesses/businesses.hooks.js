import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { businessesService } from '../../services/businesses.service'

export function useBusinesses(initialParams = {}) {
  const [params, setParams] = useState({ page: 1, pageSize: 10, search: '', status: '', ...initialParams })

  const { data, loading, error, refetch } = useAsync(
    () => businessesService.list(params),
    [params.page, params.pageSize, params.search, params.status, params.customerId]
  )

  return {
    businesses: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setSearch: (search) => setParams((p) => ({ ...p, search, page: 1 })),
    setStatus: (status) => setParams((p) => ({ ...p, status, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}

export function useBusiness(id) {
  return useAsync(() => businessesService.get(id), [id])
}
