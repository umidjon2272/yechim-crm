import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { leadsService } from '../../services/leads.service'

export function useLeads() {
  const [params, setParams] = useState({ page: 1, pageSize: 10, search: '', status: '', source: '', sort: '-createdAt' })

  const { data, loading, error, refetch } = useAsync(
    () => leadsService.list(params),
    [params.page, params.pageSize, params.search, params.status, params.source, params.sort]
  )

  return {
    leads: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setSearch: (search) => setParams((p) => ({ ...p, search, page: 1 })),
    setStatus: (status) => setParams((p) => ({ ...p, status, page: 1 })),
    setSource: (source) => setParams((p) => ({ ...p, source, page: 1 })),
    setSort: (sort) => setParams((p) => ({ ...p, sort, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}

export function useLead(id) {
  return useAsync(() => leadsService.get(id), [id])
}
