import { ApiError } from './ApiError'
import { formatError } from '../utils/formatError'
import { getAccessToken, getRefreshToken, writeAuthTokens } from '../features/auth/authStorage'

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://yechim-backend.onrender.com/api'
).replace(/\/$/, '')

export { ApiError }

let unauthorizedHandler = null
let refreshPromise = null
let requestSequence = 0
const inFlightGetRequests = new Map()

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function buildUrl(path, params) {
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

const AUTH_PATHS_WITHOUT_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout']
const REQUEST_TIMEOUT_MS = 15000
const TRANSIENT_RETRY_DELAYS_MS = [250, 750, 1500]

function perfEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF_TIMING === 'true'
}

function logRequestTiming(path, method, duration, status, attempt = 1) {
  if (!perfEnabled()) return
  const suffix = attempt > 1 ? ` retry=${attempt - 1}` : ''
  console.info(`[YECHIM perf] ${method} ${path} ${Math.round(duration)}ms status=${status}${suffix}`)
}

function getRequestKey(path, options) {
  if ((options.method || 'GET').toUpperCase() !== 'GET' || options.signal) return null
  return `${buildUrl(path, options.params)}|${getAccessToken() || ''}`
}

async function refreshSession() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new ApiError('Sessiya muddati tugagan', { status: 401 })
    }
    refreshPromise = request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      skipRefresh: true,
      skipAuth: true,
      // Render cold starts can affect the refresh endpoint too. Refresh is
      // safe to retry because the server keeps the refresh token stable.
      maxRetries: 2,
    })
      .then((data) => {
        if (!data?.accessToken) {
          throw new ApiError('Refresh token noto\'g\'ri javob qaytardi', { status: 401 })
        }
        writeAuthTokens({ accessToken: data.accessToken })
        return data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function performRequest(
  path,
  { method = 'GET', body, params, headers, signal, skipRefresh = false, skipAuth = false, accessToken, attempt = 1 } = {},
) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const timeoutController = new AbortController()
  let timedOut = false
  const timeoutId = window.setTimeout(() => {
    timedOut = true
    timeoutController.abort()
  }, REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => timeoutController.abort()
  const clearRequestTimeout = () => {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
  if (signal) {
    if (signal.aborted) timeoutController.abort()
    else signal.addEventListener('abort', abortFromCaller, { once: true })
  }

  const token = accessToken === undefined ? getAccessToken() : accessToken
  const requestStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const requestId = ++requestSequence

  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      // Auth is explicitly carried by the persisted token for this CRM
      // account. No user object is trusted from storage; /auth/me remains the
      // source of truth after every app launch.
      credentials: 'omit',
      headers: {
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        Accept: 'application/json',
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: timeoutController.signal,
    })
  } catch (networkError) {
    clearRequestTimeout()
    const failedDuration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestStartedAt
    if (networkError?.name === 'AbortError') {
      if (timedOut) logRequestTiming(path, method, failedDuration, 408, attempt)
      if (timedOut) throw new ApiError('So‘rov vaqti tugadi. Qayta urinib ko‘ring.', { status: 408 })
      throw networkError
    }
    throw new ApiError('Backend bilan aloqa qilib bo‘lmadi', { status: 0, details: networkError })
  }

  logRequestTiming(path, method, (typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestStartedAt, res.status, attempt)
  if (perfEnabled() && typeof performance !== 'undefined') performance.mark(`yechim:request:${requestId}:done`)

  let refreshFailed = false

  if (res.status === 401 && !skipRefresh && !AUTH_PATHS_WITHOUT_REFRESH.includes(path)) {
    try {
      await refreshSession()
      clearRequestTimeout()
      return request(path, { method, body, params, headers, signal, skipRefresh: true, accessToken: undefined })
    } catch (refreshError) {
      // Only an invalid/expired refresh session is an auth failure. Preserve
      // transient refresh errors so startup can retry instead of treating a
      // cold start as an invalid session.
      if (refreshError?.status !== 401) throw refreshError
      refreshFailed = true
    }
  }

  const contentType = res.headers.get('content-type') || ''
  if (res.headers.has('x-vercel-error') || !contentType.includes('application/json')) {
    clearRequestTimeout()
    throw new ApiError(`API noto‘g‘ri javob qaytardi (${res.status})`, { status: res.status })
  }

  let data = null
  try {
    data = await res.json()
  } catch (parseError) {
    if (timedOut) throw new ApiError('Request timed out. Please try again.', { status: 408 })
    if (parseError?.name === 'AbortError') throw parseError
  } finally {
    clearRequestTimeout()
  }

  if (res.status === 401 && (skipRefresh || refreshFailed || AUTH_PATHS_WITHOUT_REFRESH.includes(path))) {
    unauthorizedHandler?.()
  }

  if (!res.ok) {
    throw new ApiError(formatError(data, `So‘rov bajarilmadi (${res.status})`), { status: res.status, details: data })
  }

  return data
}

async function request(path, options = {}) {
  const normalizedOptions = { method: 'GET', ...options }
  const method = normalizedOptions.method.toUpperCase()

  // The map only deduplicates GETs that are currently in flight. A mutation
  // makes every such response stale, so a following refetch must go to the
  // API instead of receiving the pre-mutation response.
  if (method !== 'GET') inFlightGetRequests.clear()

  const key = getRequestKey(path, normalizedOptions)
  if (key && inFlightGetRequests.has(key)) return inFlightGetRequests.get(key)

  const run = (async () => {
    try {
      return await performRequest(path, normalizedOptions)
    } catch (error) {
      const retryCount = Number(normalizedOptions.retryCount || 0)
      const maxRetries = Number(normalizedOptions.maxRetries ?? (method === 'GET' ? 3 : 0))
      const transientStatus = error?.status === 0 || error?.status === 408 || [500, 502, 503, 504].includes(error?.status)
      const canRetry = !normalizedOptions.signal && transientStatus && retryCount < maxRetries
      if (canRetry) {
        const delay = TRANSIENT_RETRY_DELAYS_MS[Math.min(retryCount, TRANSIENT_RETRY_DELAYS_MS.length - 1)]
        await new Promise((resolve) => window.setTimeout(resolve, delay))
        return request(path, { ...normalizedOptions, retryCount: retryCount + 1 })
      }
      throw error
    }
  })()

  if (key) {
    inFlightGetRequests.set(key, run)
    run.finally(() => {
      if (inFlightGetRequests.get(key) === run) inFlightGetRequests.delete(key)
    }).catch(() => {})
  }
  return run
}

export const httpClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
