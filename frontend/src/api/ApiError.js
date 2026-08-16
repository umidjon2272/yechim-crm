// Shared error shape for both the real httpClient and the demo-data fallback
// engine, so callers (services/hooks/components) get identical `.message`/
// `.status`/`.details` regardless of which one actually answered a request.
// Split into its own file so demoEngine.js (which httpClient.js falls back
// to) can throw the same class without a circular import between the two.
export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}
