import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyThemeToDocument } from './applyTheme'
import {
  DEFAULT_THEME_ID,
  getThemeDefinition,
  isRegisteredThemeId,
  THEME_REGISTRY,
} from './registry'
import { readStoredThemeId, writeStoredThemeId } from './storage'
import { ThemeContext } from './ThemeContext'
import type { ThemeContextValue, ThemeId } from './types'

interface ThemeProviderProps {
  children: ReactNode
  /** Override persisted theme (e.g. tests) */
  initialThemeId?: ThemeId
}

function resolveInitialThemeId(initialThemeId?: ThemeId): ThemeId {
  if (initialThemeId != null) {
    return initialThemeId
  }
  return readStoredThemeId()
}

export default function ThemeProvider({ children, initialThemeId }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() =>
    resolveInitialThemeId(initialThemeId),
  )

  // Bootstrap script sets data-theme before paint; sync meta without animating
  useEffect(() => {
    applyThemeToDocument(themeId, { animate: false })
  // Mount-only — user changes go through setTheme with animation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTheme = useCallback((id: ThemeId) => {
    if (!isRegisteredThemeId(id) || id === themeId) {
      return
    }
    writeStoredThemeId(id)
    setThemeIdState(id)
    applyThemeToDocument(id, { animate: true })
  }, [themeId])

  const value = useMemo<ThemeContextValue>(() => ({
    themeId,
    theme: getThemeDefinition(themeId),
    themes: THEME_REGISTRY,
    setTheme,
    isThemeId: isRegisteredThemeId,
  }), [themeId, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { DEFAULT_THEME_ID }
