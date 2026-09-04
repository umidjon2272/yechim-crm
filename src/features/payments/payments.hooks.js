import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { paymentsService } from '../../services/payments.service'

export function usePayments(initialParams = {}) {
  const [params, setParams] = useState({ page: 1, pageSize: 10, status: '', method: '', ...initialParams })

  const { data, loading, error, refetch } = useAsync(
    () => paymentsService.list(params),
    [params.page, params.pageSize, params.status, params.method, params.dealId]
  )

  return {
    payments: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setStatus: (status) => setParams((p) => ({ ...p, status, page: 1 })),
    setMethod: (method) => setParams((p) => ({ ...p, method, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}
