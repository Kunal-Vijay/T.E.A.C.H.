import type { ThemeDefinition, ThemeId } from './types'

/** Default theme — Light Paper */
export const DEFAULT_THEME_ID: ThemeId = 'light-paper'

export const THEME_STORAGE_KEY = 'teach_theme'

export const THEME_REGISTRY: readonly ThemeDefinition[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep hub shell with teal accent — the default T.E.A.C.H experience.',
    tagline: 'Premium dark workspace',
    emoji: '🌑',
    experience: {
      title: 'Study Into the Night',
      description: 'Immersive darkness for when the world goes quiet and focus finds you.',
      emoji: '🌙',
    },
  },
  {
    id: 'light-paper',
    name: 'Light Paper',
    description: 'Soft white surfaces and calm typography — built for reading.',
    tagline: 'Clean reading experience',
    emoji: '☀️',
    experience: {
      title: 'Learn in Daylight',
      description: 'Bright, clean, and comfortable for long reading sessions.',
      emoji: '☀️',
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Dark creative shell with muted indigo, blue, and teal accents.',
    tagline: 'Modern creative workspace',
    emoji: '🌌',
    experience: {
      title: 'Beyond the Classroom',
      description: 'A vibrant canvas where curiosity sparks and ideas take flight.',
      emoji: '🚀',
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Near-monochrome for long sessions — subtle teal, zero distraction.',
    tagline: 'Minimal distraction-free learning',
    emoji: '🎯',
    experience: {
      title: 'Nothing But the Lesson',
      description: 'A distraction-free sanctuary built for deep concentration.',
      emoji: '🎯',
    },
  },
] as const

const THEME_BY_ID: Record<ThemeId, ThemeDefinition> =
  THEME_REGISTRY.reduce(
    (accumulator, theme) => {
      accumulator[theme.id] = theme
      return accumulator
    },
    {} as Record<ThemeId, ThemeDefinition>,
  )

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEME_BY_ID[id]
}

export function isRegisteredThemeId(value: string): value is ThemeId {
  return value in THEME_BY_ID
}

export function listThemeIds(): ThemeId[] {
  return THEME_REGISTRY.map((theme) => theme.id)
}

/** Learning experiences for Welcome — same order as registry */
export function listLearningExperiences(): readonly ThemeDefinition[] {
  return THEME_REGISTRY
}
