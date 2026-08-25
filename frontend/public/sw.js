const CACHE_NAME = 'yechim-crm-shell-v4'
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/yechim.svg',
  '/icons/yechim-180.png',
  '/icons/yechim-192.png',
  '/icons/yechim-512.png',
  '/icons/yechim-maskable-512.png',
  '/icons/yechim-maskable.svg',
  '/icons/yechim-splash.png',
  '/icons/yechim-splash.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API responses, including auth and customer data, are always network-only.
  // The backend also sends no-store headers, but keeping this explicit avoids
  // a stale browser cache becoming a second cache layer in an installed PWA.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
