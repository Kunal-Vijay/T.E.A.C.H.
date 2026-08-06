import { createContext } from 'react'
import type { EnvironmentContextValue } from './types'

export const EnvironmentContext = createContext<EnvironmentContextValue | null>(null)
