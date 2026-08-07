import { DEFAULT_ENVIRONMENT_ID, isRegisteredEnvironmentId, ENVIRONMENT_STORAGE_KEY } from './registry'
import type { EnvironmentId } from './types'

export function readStoredEnvironmentId(): EnvironmentId {
  if (typeof window === 'undefined') {
    return DEFAULT_ENVIRONMENT_ID
  }

  try {
    const stored = window.localStorage.getItem(ENVIRONMENT_STORAGE_KEY)
    if (stored != null && isRegisteredEnvironmentId(stored)) {
      return stored
    }
  } catch {
    /* localStorage unavailable */
  }

  return DEFAULT_ENVIRONMENT_ID
}

export function writeStoredEnvironmentId(environmentId: EnvironmentId): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(ENVIRONMENT_STORAGE_KEY, environmentId)
  } catch {
    /* ignore */
  }
}
