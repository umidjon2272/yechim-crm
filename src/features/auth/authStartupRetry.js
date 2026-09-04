export const AUTH_RETRY_DELAYS_MS = [1000, 2000, 3000, 5000, 8000, 10000]
export const AUTH_RETRY_WINDOW_MS = 45000
export const AUTH_REQUEST_TIMEOUT_MS = 7000
// The first auth request gets a longer budget so a sleeping backend can finish
// waking without the browser aborting and restarting the same request every 7s.
// Subsequent retries keep the short normal request timeout.
export const AUTH_FIRST_REQUEST_TIMEOUT_MS = 35000

const RETRYABLE_AUTH_STATUSES = new Set([0, 408, 502, 503, 504])

export function isRetryableAuthError(error) {
  return RETRYABLE_AUTH_STATUSES.has(Number(error?.status || 0))
}

export async function restoreWithRetry(
  request,
  {
    now = () => Date.now(),
    sleep = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
    retryDelaysMs = AUTH_RETRY_DELAYS_MS,
    retryWindowMs = AUTH_RETRY_WINDOW_MS,
    requestTimeoutMs = AUTH_REQUEST_TIMEOUT_MS,
    firstRequestTimeoutMs = AUTH_FIRST_REQUEST_TIMEOUT_MS,
  } = {},
) {
  const startedAt = now()
  const deadline = startedAt + retryWindowMs
  let retryIndex = 0
  let attempts = 0
  let lastError = null

  while (now() < deadline) {
    attempts += 1
    const perAttemptTimeoutMs = attempts === 1 ? firstRequestTimeoutMs : requestTimeoutMs
    const timeoutMs = Math.min(perAttemptTimeoutMs, deadline - now())

    try {
      // attempts is 1-based and already reflects this call, so the request's
      // own startup log (attempt=N retry=N-1) matches what actually happened
      // instead of always reporting attempt=1.
      return { kind: 'success', value: await request({ timeoutMs, attempt: attempts }), attempts }
    } catch (error) {
      lastError = error
      if (Number(error?.status) === 401) return { kind: 'unauthorized', error, attempts }
      if (!isRetryableAuthError(error)) break

      const delayMs = retryDelaysMs[Math.min(retryIndex, retryDelaysMs.length - 1)]
      retryIndex += 1
      const waitMs = Math.min(delayMs, Math.max(0, deadline - now()))
      if (!waitMs) break
      await sleep(waitMs)
    }
  }

  return { kind: 'retryableError', error: lastError, attempts }
}
