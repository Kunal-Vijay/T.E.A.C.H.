import { useContext } from 'react'
import { EnvironmentContext } from './EnvironmentContext'
import type { EnvironmentContextValue } from './types'

export function useEnvironment(): EnvironmentContextValue {
  const context = useContext(EnvironmentContext)
  if (context == null) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider')
  }
  return context
}
