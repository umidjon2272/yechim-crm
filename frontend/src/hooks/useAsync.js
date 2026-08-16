import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Standardizes the loading/error/data/empty pattern used across list & detail
 * pages. `asyncFn` is re-run whenever `deps` change.
 */
export function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const run = useCallback(() => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    return asyncFn()
      .then((result) => {
        if (requestId.current === currentRequest) {
          setData(result)
        }
        return result
      })
      .catch((err) => {
        if (requestId.current === currentRequest) {
          setError(err)
        }
        throw err
      })
      .finally(() => {
        if (requestId.current === currentRequest) {
          setLoading(false)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { data, error, loading, refetch: run }
}
