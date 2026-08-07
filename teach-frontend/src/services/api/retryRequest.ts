import { toApiError } from './apiError'

const RETRYABLE_CODES = new Set(['network', 'timeout'])
const MAX_RETRIES = 3
const BASE_DELAY_MS = 400

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { isRetryable?: (error: unknown) => boolean; maxRetries?: number } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES
  const isRetryable = options.isRetryable ?? (() => true)
  let attempt = 0
  let lastError: unknown

  while (attempt <= maxRetries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error
      }
      await delay(BASE_DELAY_MS * 2 ** attempt)
      attempt += 1
    }
  }

  throw lastError
}

export function isRetryableGetError(error: unknown): boolean {
  const apiError = toApiError(error)
  return RETRYABLE_CODES.has(apiError.code) || apiError.status === 502 || apiError.status === 503
}
