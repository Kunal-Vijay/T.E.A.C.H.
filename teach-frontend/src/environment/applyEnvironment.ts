import type { EnvironmentId } from './types'

const ROOT = typeof document !== 'undefined' ? document.documentElement : null

/** Apply environment via `data-environment` on `<html>`. Ambience CSS responds automatically. */
export function applyEnvironmentToDocument(environmentId: EnvironmentId): void {
  ROOT?.setAttribute('data-environment', environmentId)
}

export function readDocumentEnvironmentId(): EnvironmentId | null {
  const value = ROOT?.getAttribute('data-environment')
  if (value == null || value === '') {
    return null
  }
  return value as EnvironmentId
}
