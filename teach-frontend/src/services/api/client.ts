import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { getRole } from '../auth/authService'
import { toApiError } from './apiError'
import { getCached, setCached } from './responseCache'
import { isRetryableGetError, withRetry } from './retryRequest'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipRetry?: boolean
    skipCache?: boolean
    cacheKey?: string
    cacheTtlMs?: number
  }
}

async function normalizeAxiosError(error: unknown): Promise<unknown> {
  if (!axios.isAxiosError(error) || error.response?.data === undefined) {
    return error
  }

  const { data } = error.response
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      error.response.data = JSON.parse(text) as unknown
    } catch {
      error.response.data = { detail: 'Request failed.' }
    }
  }

  return error
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const role = getRole()
  if (role !== null) {
    config.headers['X-Teach-Role'] = role
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalized = await normalizeAxiosError(error)
    if (axios.isAxiosError(normalized)) {
      return Promise.reject(toApiError(normalized, normalized.response?.data))
    }
    return Promise.reject(toApiError(normalized))
  },
)

export async function getWithCache<T>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<T> {
  const cacheKey = config.cacheKey ?? url

  if (!config.skipCache) {
    const cached = getCached<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const fetch = () => apiClient.get<T>(url, config).then((response) => response.data)

  const data = config.skipRetry
    ? await fetch()
    : await withRetry(fetch, { isRetryable: isRetryableGetError })

  if (!config.skipCache && config.cacheTtlMs !== 0) {
    setCached(cacheKey, data, config.cacheTtlMs ?? 15_000)
  }

  return data
}

export default apiClient
