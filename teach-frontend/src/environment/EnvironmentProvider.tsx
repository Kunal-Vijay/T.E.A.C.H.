import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyEnvironmentToDocument } from './applyEnvironment'
import { EnvironmentContext } from './EnvironmentContext'
import {
  DEFAULT_ENVIRONMENT_ID,
  ENVIRONMENT_REGISTRY,
  getEnvironmentDefinition,
  isRegisteredEnvironmentId,
} from './registry'
import { readStoredEnvironmentId, writeStoredEnvironmentId } from './storage'
import type { EnvironmentContextValue, EnvironmentId } from './types'

interface EnvironmentProviderProps {
  children: ReactNode
  initialEnvironmentId?: EnvironmentId
}

function resolveInitialEnvironmentId(initialEnvironmentId?: EnvironmentId): EnvironmentId {
  if (initialEnvironmentId != null) {
    return initialEnvironmentId
  }
  return readStoredEnvironmentId()
}

export default function EnvironmentProvider({
  children,
  initialEnvironmentId,
}: EnvironmentProviderProps) {
  const [environmentId, setEnvironmentIdState] = useState<EnvironmentId>(() =>
    resolveInitialEnvironmentId(initialEnvironmentId),
  )

  const setEnvironment = useCallback((id: EnvironmentId) => {
    if (!isRegisteredEnvironmentId(id)) {
      return
    }
    setEnvironmentIdState(id)
    applyEnvironmentToDocument(id)
    writeStoredEnvironmentId(id)
  }, [])

  useEffect(() => {
    applyEnvironmentToDocument(environmentId)
  }, [environmentId])

  const value = useMemo<EnvironmentContextValue>(() => ({
    environmentId,
    environment: getEnvironmentDefinition(environmentId),
    environments: ENVIRONMENT_REGISTRY,
    setEnvironment,
    isEnvironmentId: isRegisteredEnvironmentId,
  }), [environmentId, setEnvironment])

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export { DEFAULT_ENVIRONMENT_ID }
