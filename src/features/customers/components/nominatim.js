const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org'
const responseCache = new Map()
const pendingRequests = new Map()

function cacheKey(path, params) {
  return `${path}?${new URLSearchParams(params).toString()}`
}

async function requestNominatim(path, params) {
  const key = cacheKey(path, params)
  if (responseCache.has(key)) return responseCache.get(key)
  if (pendingRequests.has(key)) return pendingRequests.get(key)

  const request = fetch(`${NOMINATIM_ENDPOINT}${path}?${new URLSearchParams(params)}`, {
    headers: { Accept: 'application/json' },
  }).then(async (response) => {
    if (!response.ok) throw new Error('Nominatim request failed')
    const data = await response.json()
    responseCache.set(key, data)
    return data
  }).finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, request)
  return request
}

export function searchNominatim(query) {
  return requestNominatim('/search', {
    q: query.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'uz,ru,en',
  })
}

export function reverseNominatim(latitude, longitude) {
  return requestNominatim('/reverse', {
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'uz,ru,en',
  })
}

export function nominatimLabel(result) {
  return result?.display_name || ''
}
