import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { tasksService } from '../../services/tasks.service'
import { usePermissions } from '../roles/usePermissions'

export function useTasks() {
  const { can } = usePermissions()
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    status: '',
    priority: '',
    assignedToMe: !can('tasks.viewAll'),
  })

  const { data, loading, error, refetch } = useAsync(
    () => tasksService.list(params),
    [params.page, params.pageSize, params.status, params.priority, params.assignedToMe]
  )

  return {
    tasks: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    canViewAll: can('tasks.viewAll'),
    setStatus: (status) => setParams((p) => ({ ...p, status, page: 1 })),
    setPriority: (priority) => setParams((p) => ({ ...p, priority, page: 1 })),
    setAssignedToMe: (assignedToMe) => setParams((p) => ({ ...p, assignedToMe, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    loading,
    error,
    refetch,
  }
}
