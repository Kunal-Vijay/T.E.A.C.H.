import axios from 'axios'

export type ErrorCode =
  | 'http'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'client'
  | 'unknown'

export class ApiError extends Error {
  readonly status: number | null
  readonly code: ErrorCode
  readonly detail: string | null
  readonly endpoint: string | null
  readonly method: string | null
  readonly responseBody: unknown

  constructor(
    message: string,
    options: {
      status?: number | null
      code?: ErrorCode
      detail?: string | null
      endpoint?: string | null
      method?: string | null
      responseBody?: unknown
    } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? null
    this.code = options.code ?? 'unknown'
    this.detail = options.detail ?? null
    this.endpoint = options.endpoint ?? null
    this.method = options.method ?? null
    this.responseBody = options.responseBody ?? null
  }
}

export interface DisplayedErrorContext {
  component?: string
  action?: string
  endpoint?: string
  method?: string
  [key: string]: string | undefined
}

function parseDetailFromBody(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim()
    return trimmed !== '' ? trimmed : null
  }
  if (Array.isArray(data)) {
    const messages = data
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }
        if (item !== null && typeof item === 'object') {
          const record = item as { msg?: unknown; message?: unknown }
          if (typeof record.msg === 'string') {
            return record.msg
          }
          if (typeof record.message === 'string') {
            return record.message
          }
        }
        return null
      })
      .filter((item): item is string => item !== null && item !== '')
    return messages.length > 0 ? messages.join(' ') : null
  }
  if (data !== null && typeof data === 'object' && 'detail' in data) {
    return parseDetailFromBody((data as { detail: unknown }).detail)
  }
  return null
}

function mapHttpStatusToMessage(status: number, detail: string | null): string {
  if (status >= 500) {
    return 'Internal server error. Please try again later.'
  }

  if (detail !== null && detail !== '' && detail !== 'Internal server error') {
    return detail
  }

  switch (status) {
    case 400:
      return 'Invalid request.'
    case 401:
      return 'Authentication required.'
    case 403:
      return 'Permission denied.'
    case 404:
      return 'Resource not found.'
    case 409:
      return 'Conflict. The resource may have changed.'
    case 422:
      return detail ?? 'Invalid data. Check your input and try again.'
    case 429:
      return 'Too many requests. Please wait and try again.'
    default:
      return detail ?? `Request failed (${status}).`
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isCancelledError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.code === 'cancelled'
  }
  if (axios.isAxiosError(error)) {
    return error.code === 'ERR_CANCELED' || error.message === 'canceled'
  }
  return false
}

export function shouldDisplayError(error: unknown): boolean {
  return !isCancelledError(error)
}

export function toApiError(error: unknown, responseData?: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null
    const endpoint = error.config?.url ?? null
    const method = error.config?.method?.toUpperCase() ?? null
    const body = responseData ?? error.response?.data
    const detail = parseDetailFromBody(body)

    if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
      return new ApiError('', {
        status,
        code: 'cancelled',
        detail,
        endpoint,
        method,
        responseBody: body,
      })
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('Request timed out. Please try again.', {
        status,
        code: 'timeout',
        detail,
        endpoint,
        method,
        responseBody: body,
      })
    }

    if (!error.response) {
      return new ApiError('Unable to connect. Check your network and try again.', {
        status,
        code: 'network',
        detail,
        endpoint,
        method,
        responseBody: body,
      })
    }

    const message = status !== null
      ? mapHttpStatusToMessage(status, detail)
      : detail ?? error.message

    return new ApiError(message, {
      status,
      code: 'http',
      detail,
      endpoint,
      method,
      responseBody: body,
    })
  }

  if (error instanceof Error) {
    return new ApiError('Something went wrong. Please refresh the page.', {
      code: 'client',
      detail: error.message,
    })
  }

  return new ApiError('Something went wrong.', { code: 'unknown' })
}

export function logDisplayedError(error: unknown, context: DisplayedErrorContext = {}): void {
  const apiError = toApiError(error)
  if (isCancelledError(apiError)) {
    return
  }

  const payload = {
    component: context.component ?? 'unknown',
    action: context.action,
    endpoint: context.endpoint ?? apiError.endpoint ?? undefined,
    method: context.method ?? apiError.method ?? undefined,
    status: apiError.status,
    code: apiError.code,
    message: apiError.message,
    detail: apiError.detail,
    responseBody: apiError.responseBody,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  }

  if (import.meta.env.DEV) {
    console.error('[teach:error]', payload)
  }

  window.dispatchEvent(
    new CustomEvent('teach:error-displayed', { detail: payload }),
  )
}

export function getUserMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isCancelledError(error)) {
    return ''
  }

  const apiError = toApiError(error)

  if (apiError.code === 'client') {
    return apiError.message
  }

  if (apiError.message !== '') {
    return apiError.message
  }

  return fallback
}

/** Log, classify, and return a user-facing message — or null if the error should not be shown. */
export function resolveDisplayedError(
  error: unknown,
  context: DisplayedErrorContext,
  fallback: string,
): string | null {
  if (!shouldDisplayError(error)) {
    return null
  }
  logDisplayedError(error, context)
  const message = getUserMessage(error, fallback)
  return message !== '' ? message : null
}
