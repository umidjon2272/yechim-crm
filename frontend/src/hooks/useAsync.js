import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_TIMEOUT_MS = 15000

function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      const error = new Error('So‘rov vaqti tugadi. Qayta urinib ko‘ring.')
      error.status = 408
      reject(error)
    }, timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => globalThis.clearTimeout(timeoutId))
}

/**
 * Standardizes the loading/error/data/empty pattern used across list & detail
 * pages. `asyncFn` is re-run whenever `deps` change.
 */
export function useAsync(asyncFn, deps = [], options = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const run = useCallback(() => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    return withTimeout(Promise.resolve().then(() => asyncFn()), timeoutMs)
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
  }, [...deps, timeoutMs])

  useEffect(() => {
    run().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { data, error, loading, refetch: run }
}
