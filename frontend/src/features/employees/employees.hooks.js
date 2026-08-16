import { useCallback, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { employeesService } from '../../services/employees.service'

export function useEmployees() {
  const [params, setParams] = useState({ page: 1, pageSize: 10, search: '' })

  const { data, loading, error, refetch } = useAsync(
    () => employeesService.list(params),
    [params.page, params.pageSize, params.search]
  )

  const setSearch = useCallback((search) => setParams((p) => ({ ...p, search, page: 1 })), [])
  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), [])

  return {
    employees: data?.items ?? [],
    total: data?.total ?? 0,
    params,
    setSearch,
    setPage,
    loading,
    error,
    refetch,
  }
}

export function useEmployee(id) {
  return useAsync(() => employeesService.get(id), [id])
}
