// Shared error shape for API callers (services/hooks/components), so they get
// identical `.message`/`.status`/`.details` values for every HTTP response.
export class ApiError extends Error {
  constructor(message, { status, details, code, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = code
    this.cause = cause
  }
}
