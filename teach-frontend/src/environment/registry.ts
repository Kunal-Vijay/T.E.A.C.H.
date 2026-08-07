import type { EnvironmentDefinition, EnvironmentId } from './types'

export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = 'ai-lab'

export const ENVIRONMENT_STORAGE_KEY = 'teach_environment'

export const ENVIRONMENT_REGISTRY: readonly EnvironmentDefinition[] = [
  {
    id: 'ai-lab',
    name: 'Study Lab',
    description: 'Teal intelligence glow — the default T.E.A.C.H atmosphere.',
    emoji: '✨',
  },
  {
    id: 'classroom',
    name: 'Classroom',
    description: 'Structured learning space with calm institutional light.',
    emoji: '📚',
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Warm lamplight and quiet focus — built for deep reading.',
    emoji: '📖',
  },
  {
    id: 'study-cafe',
    name: 'Study Café',
    description: 'Soft bokeh warmth — relaxed but productive.',
    emoji: '☕',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Organic greens and dappled light — calm and grounding.',
    emoji: '🌿',
  },
  {
    id: 'space',
    name: 'Space',
    description: 'Deep cosmos with distant stars — expansive and quiet.',
    emoji: '🌌',
  },
] as const

const ENVIRONMENT_BY_ID: Record<EnvironmentId, EnvironmentDefinition> =
  ENVIRONMENT_REGISTRY.reduce(
    (accumulator, environment) => {
      accumulator[environment.id] = environment
      return accumulator
    },
    {} as Record<EnvironmentId, EnvironmentDefinition>,
  )

export function getEnvironmentDefinition(id: EnvironmentId): EnvironmentDefinition {
  return ENVIRONMENT_BY_ID[id]
}

export function isRegisteredEnvironmentId(value: string): value is EnvironmentId {
  return value in ENVIRONMENT_BY_ID
}

export function listEnvironmentIds(): EnvironmentId[] {
  return ENVIRONMENT_REGISTRY.map((environment) => environment.id)
}
