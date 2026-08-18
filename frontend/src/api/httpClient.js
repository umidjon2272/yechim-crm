import { ApiError } from './ApiError'
import { formatError } from '../utils/formatError'

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://yechim-backend.onrender.com/api'
).replace(/\/$/, '')

export { ApiError }

let unauthorizedHandler = null
let refreshPromise = null

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

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = request('/auth/refresh', { method: 'POST', skipRefresh: true }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function request(path, { method = 'GET', body, params, headers, signal, skipRefresh = false } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: {
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        Accept: 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal,
    })
  } catch (networkError) {
    if (networkError?.name === 'AbortError') throw networkError
    throw new ApiError('Backend bilan aloqa qilib bo‘lmadi', { status: 0, details: networkError })
  }

  let refreshFailed = false

  if (res.status === 401 && !skipRefresh && !AUTH_PATHS_WITHOUT_REFRESH.includes(path)) {
    try {
      await refreshSession()
      return request(path, { method, body, params, headers, signal, skipRefresh: true })
    } catch (refreshError) {
      // Only an invalid/expired refresh session is an auth failure. A network
      // outage must not turn a temporary API error into an automatic logout.
      refreshFailed = refreshError?.status === 401
    }
  }

  const contentType = res.headers.get('content-type') || ''
  if (res.headers.has('x-vercel-error') || !contentType.includes('application/json')) {
    throw new ApiError(`API noto‘g‘ri javob qaytardi (${res.status})`, { status: res.status })
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401 && (skipRefresh || refreshFailed || AUTH_PATHS_WITHOUT_REFRESH.includes(path))) {
    unauthorizedHandler?.()
  }

  if (!res.ok) {
    throw new ApiError(formatError(data, `So‘rov bajarilmadi (${res.status})`), { status: res.status, details: data })
  }

  return data
}

export const httpClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
