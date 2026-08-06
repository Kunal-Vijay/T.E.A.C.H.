import type { ExpressionState } from '../../types/mentor.types'

const PRIORITY: Partial<Record<ExpressionState, number>> = {
  sleeping: 0,
  idle: 1,
  blink: 2,
  smile: 3,
  listening: 4,
  thinking: 5,
  speaking: 6,
  explaining: 7,
  curious: 8,
  confused: 9,
  encouraging: 10,
  concerned: 10,
  proud: 11,
  excited: 12,
  laugh: 13,
  celebrating: 14,
}

export function canTransition(from: ExpressionState, to: ExpressionState): boolean {
  if (from === to) {
    return true
  }
  if (to === 'blink' && from === 'idle') {
    return true
  }
  if (from === 'blink') {
    return to === 'idle' || (PRIORITY[to] ?? 0) > 2
  }
  return (PRIORITY[to] ?? 0) >= (PRIORITY[from] ?? 0) || to === 'idle'
}

export function transitionExpression(current: ExpressionState, next: ExpressionState): ExpressionState {
  if (canTransition(current, next)) {
    return next
  }
  return current
}
