import type { ThemeId } from './types'

const ROOT = typeof document !== 'undefined' ? document.documentElement : null

/** Crossfade duration — within 150–250ms spec */
export const THEME_SWITCH_DURATION_MS = 200

const THEME_META_COLORS: Record<ThemeId, string> = {
  midnight: '#06080f',
  'light-paper': '#fafaf8',
  aurora: '#0b0f1a',
  focus: '#0c0c0c',
}

export interface ApplyThemeOptions {
  /** Crossfade on change. Default true. Set false for bootstrap / hydration. */
  animate?: boolean
}

let switchTimeoutId: ReturnType<typeof window.setTimeout> | undefined
let activeViewTransition: { skipTransition: () => void; finished: Promise<void> } | undefined

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function updateMetaThemeColor(themeId: ThemeId): void {
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_META_COLORS[themeId])
}

function applyThemeAttributes(themeId: ThemeId): void {
  ROOT?.setAttribute('data-theme', themeId)
  updateMetaThemeColor(themeId)
}

function clearSwitchState(): void {
  if (switchTimeoutId != null) {
    window.clearTimeout(switchTimeoutId)
    switchTimeoutId = undefined
  }
  ROOT?.classList.remove('theme-switching')
}

function applyWithClassTransition(themeId: ThemeId): void {
  if (ROOT == null) {
    return
  }

  clearSwitchState()
  ROOT.classList.add('theme-switching')
  // Bind transitions to current computed colors before token swap
  void ROOT.offsetHeight
  applyThemeAttributes(themeId)

  switchTimeoutId = window.setTimeout(() => {
    ROOT?.classList.remove('theme-switching')
    switchTimeoutId = undefined
  }, THEME_SWITCH_DURATION_MS)
}

function applyWithViewTransition(themeId: ThemeId): void {
  if (ROOT == null) {
    return
  }

  if (typeof document.startViewTransition !== 'function') {
    applyWithClassTransition(themeId)
    return
  }

  clearSwitchState()

  try {
    activeViewTransition?.skipTransition()
  } catch {
    /* already finished */
  }

  activeViewTransition = document.startViewTransition(() => {
    applyThemeAttributes(themeId)
  })

  const transition = activeViewTransition
  void transition?.finished.finally(() => {
    if (activeViewTransition === transition) {
      activeViewTransition = undefined
    }
  })
}

/**
 * Apply theme to the document root via `data-theme`.
 * CSS theme files respond to this attribute automatically.
 */
export function applyThemeToDocument(
  themeId: ThemeId,
  options: ApplyThemeOptions = {},
): void {
  if (ROOT == null) {
    return
  }

  const { animate = true } = options
  const current = ROOT.getAttribute('data-theme')

  if (current === themeId && animate) {
    return
  }

  if (!animate || prefersReducedMotion()) {
    clearSwitchState()
    applyThemeAttributes(themeId)
    return
  }

  applyWithViewTransition(themeId)
}

export function readDocumentThemeId(): ThemeId | null {
  const value = ROOT?.getAttribute('data-theme')
  if (value == null || value === '') {
    return null
  }
  return value as ThemeId
}
