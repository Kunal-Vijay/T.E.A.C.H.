import type { ClassroomAvatarMode, ExpressionState } from '../../types/mentor.types'

export function classroomModeToExpression(mode: ClassroomAvatarMode): ExpressionState {
  switch (mode) {
    case 'speaking':
      return 'speaking'
    case 'listening':
      return 'listening'
    case 'questioning':
      return 'curious'
    default:
      return 'idle'
  }
}

export function quizResultToExpression(correct: boolean): ExpressionState {
  return correct ? 'celebrating' : 'encouraging'
}
