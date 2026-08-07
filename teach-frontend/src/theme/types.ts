/**
 * TEACH theme identifiers.
 * Must match `data-theme` values in CSS and the theme registry.
 */
export type ThemeId = 'midnight' | 'light-paper' | 'aurora' | 'focus'

export interface ThemeExperienceCopy {
  /** Emotional title shown on Welcome — how users choose to learn */
  title: string
  /** Short atmospheric description */
  description: string
  emoji: string
}

export interface ThemeDefinition {
  id: ThemeId
  /** Technical name for Settings */
  name: string
  /** Longer copy for Settings */
  description: string
  /** @deprecated Use experience.title on Welcome */
  tagline: string
  /** Emoji for Settings cards */
  emoji: string
  /** Curated learning experience copy for Welcome */
  experience: ThemeExperienceCopy
}

export interface ThemeContextValue {
  themeId: ThemeId
  theme: ThemeDefinition
  /** All registered themes */
  themes: readonly ThemeDefinition[]
  /** Switch theme, persist, and apply `data-theme` on `<html>` */
  setTheme: (id: ThemeId) => void
  /** True when theme id is registered */
  isThemeId: (value: string) => value is ThemeId
}
