/** Classroom environment identifiers — ambience only, not theme colors. */
export type EnvironmentId =
  | 'ai-lab'
  | 'classroom'
  | 'library'
  | 'study-cafe'
  | 'nature'
  | 'space'

export interface EnvironmentDefinition {
  id: EnvironmentId
  name: string
  description: string
  emoji: string
}

export interface EnvironmentContextValue {
  environmentId: EnvironmentId
  environment: EnvironmentDefinition
  environments: readonly EnvironmentDefinition[]
  setEnvironment: (id: EnvironmentId) => void
  isEnvironmentId: (value: string) => value is EnvironmentId
}
