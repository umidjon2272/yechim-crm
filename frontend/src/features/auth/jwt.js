// Client-side JWT inspection is a UX optimization only — it lets startup skip
// a doomed auth/me request when the access token is already expired. The
// server remains the sole authority on validity; nothing here is trusted for
// authorization.

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Returns true only when the token can be decoded and its exp claim has
// passed. An undecodable or claim-less token is treated as "unknown" (false)
// so the normal auth/me -> 401 -> refresh path still handles it.
export function isAccessTokenExpired(token, { leewaySec = 5 } = {}) {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return Date.now() >= (payload.exp - leewaySec) * 1000
}
