// Turns *anything* that might land in a catch block or an API error body
// into a safe, readable Uzbek-friendly string — never "[object Object]".
// Handles: plain strings, Error/ApiError instances (even ones whose own
// `.message` was accidentally set to a non-string), arrays, and nested
// API-style error shapes like { error: { message: '...' } }.
export function formatError(value, fallback = 'Xatolik yuz berdi') {
  const text = stringify(value)
  return text || fallback
}

function stringify(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (value instanceof Error) {
    if (typeof value.message === 'string' && value.message && value.message !== '[object Object]') {
      return value.message
    }
    // `new Error(someObject)` silently stringifies to "[object Object]" —
    // fall through and try to pull something readable out of the original
    // object shape instead (details/response body, if attached).
    return stringify(value.details) || value.name || ''
  }

  if (Array.isArray(value)) {
    return value.map(stringify).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    if (typeof value.message === 'string' && value.message) return value.message
    if (typeof value.error === 'string' && value.error) return value.error
    // Nested shapes: { message: {...} } or { error: {...} }
    if (value.message && typeof value.message === 'object') return stringify(value.message)
    if (value.error && typeof value.error === 'object') return stringify(value.error)
    try {
      const json = JSON.stringify(value)
      return json && json !== '{}' ? json : ''
    } catch {
      return ''
    }
  }

  return String(value)
}
