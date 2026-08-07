import type { ExpressionState } from '../../types/mentor.types'
import { transitionExpression } from './expressionStateMachine'

export interface ExpressionController {
  getState: () => ExpressionState
  setState: (next: ExpressionState) => void
  pulse: (next: ExpressionState, durationMs?: number) => void
  reset: () => void
}

export function createExpressionController(
  onChange: (state: ExpressionState) => void,
  initial: ExpressionState = 'idle',
): ExpressionController {
  let current = initial
  let pulseTimer: number | null = null

  const setState = (next: ExpressionState) => {
    current = transitionExpression(current, next)
    onChange(current)
  }

  const pulse = (next: ExpressionState, durationMs = 2400) => {
    if (pulseTimer !== null) {
      window.clearTimeout(pulseTimer)
    }
    setState(next)
    pulseTimer = window.setTimeout(() => {
      setState('idle')
      pulseTimer = null
    }, durationMs)
  }

  const reset = () => {
    if (pulseTimer !== null) {
      window.clearTimeout(pulseTimer)
      pulseTimer = null
    }
    current = 'idle'
    onChange(current)
  }

  return {
    getState: () => current,
    setState,
    pulse,
    reset,
  }
}
