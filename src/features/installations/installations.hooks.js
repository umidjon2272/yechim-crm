import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { installationsService } from '../../services/installations.service'

export function useInstallations(initialParams = {}) {
  const [params, setParams] = useState({ page: 1, pageSize: 10, status: '', assignedEmployeeId: '', ...initialParams })

  const { data, loading, error, refetch } = useAsync(
    () => installationsService.list(params),
    [params.page, params.pageSize, params.status, params.assignedEmployeeId, params.dealId]
  )

  return {
    installations: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setStatus: (status) => setParams((p) => ({ ...p, status, page: 1 })),
    setAssignedEmployeeId: (assignedEmployeeId) => setParams((p) => ({ ...p, assignedEmployeeId, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}

export function useInstallation(id) {
  return useAsync(() => installationsService.get(id), [id])
}
