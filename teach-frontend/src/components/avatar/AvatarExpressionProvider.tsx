import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AvatarExpression } from './AvatarExpression'

interface AvatarExpressionContextValue {
  expression: AvatarExpression
  setExpression: (expression: AvatarExpression) => void
}

const AvatarExpressionContext = createContext<AvatarExpressionContextValue | null>(null)

export interface AvatarExpressionProviderProps {
  children: ReactNode
  /** Initial expression — defaults to idle. */
  initialExpression?: AvatarExpression
  /** Controlled expression (optional). */
  expression?: AvatarExpression
  /** Controlled change handler (optional). */
  onExpressionChange?: (expression: AvatarExpression) => void
}

/**
 * Holds avatar expression state for InteractiveAvatar consumers.
 * Call `setExpression` from classroom logic — not from Avatar itself.
 */
export function AvatarExpressionProvider({
  children,
  initialExpression = 'idle',
  expression: controlledExpression,
  onExpressionChange,
}: AvatarExpressionProviderProps) {
  const [internalExpression, setInternalExpression] = useState<AvatarExpression>(initialExpression)
  const isControlled = controlledExpression !== undefined
  const expression = isControlled ? controlledExpression : internalExpression

  const setExpression = useCallback((next: AvatarExpression) => {
    if (!isControlled) {
      setInternalExpression(next)
    }
    onExpressionChange?.(next)
  }, [isControlled, onExpressionChange])

  const value = useMemo<AvatarExpressionContextValue>(() => ({
    expression,
    setExpression,
  }), [expression, setExpression])

  return (
    <AvatarExpressionContext.Provider value={value}>
      {children}
    </AvatarExpressionContext.Provider>
  )
}

export function useAvatarExpression(): AvatarExpressionContextValue {
  const ctx = useContext(AvatarExpressionContext)
  if (ctx === null) {
    throw new Error('useAvatarExpression must be used within AvatarExpressionProvider')
  }
  return ctx
}

/** Optional read when provider is absent — returns null instead of throwing. */
export function useAvatarExpressionOptional(): AvatarExpressionContextValue | null {
  return useContext(AvatarExpressionContext)
}
