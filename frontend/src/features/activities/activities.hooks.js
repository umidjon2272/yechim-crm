import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { activitiesService } from '../../services/activities.service'

export function useActivities() {
  const [params, setParams] = useState({ page: 1, pageSize: 20, type: '' })

  const { data, loading, error, refetch } = useAsync(
    () => activitiesService.list(params),
    [params.page, params.pageSize, params.type]
  )

  return {
    activities: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setType: (type) => setParams((p) => ({ ...p, type, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}
