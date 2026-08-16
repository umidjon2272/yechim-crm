import { useCallback, useState } from 'react'

/**
 * Standardizes submit state for create/update/delete-style mutations:
 * components call `run(payload)` and read back loading/error.
 */
export function useAction(actionFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        return await actionFn(...args)
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [actionFn]
  )

  return { run, loading, error, setError }
}
