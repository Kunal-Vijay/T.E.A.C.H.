import { DEFAULT_THEME_ID, isRegisteredThemeId, THEME_STORAGE_KEY } from './registry'
import type { ThemeId } from './types'

export function readStoredThemeId(): ThemeId {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_ID
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored != null && isRegisteredThemeId(stored)) {
      return stored
    }
  } catch {
    /* localStorage unavailable — fall back to default */
  }

  return DEFAULT_THEME_ID
}

export function writeStoredThemeId(themeId: ThemeId): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId)
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function clearStoredThemeId(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
