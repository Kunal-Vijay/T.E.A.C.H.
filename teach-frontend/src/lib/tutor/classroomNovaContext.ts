import type { SpeechStatus } from '../../components/avatar/SpeechController'
import type { ExpressionState } from '../../types/mentor.types'

export interface ClassroomNovaContext {
  expression: ExpressionState
  speechStatus: SpeechStatus
  isListening: boolean
  isThinking: boolean
  isCelebrating: boolean
  preferHappy?: boolean
}

/** Map live classroom signals to mentor expression + speaking flag for NovaTutor. */
export function resolveClassroomNovaContext(ctx: ClassroomNovaContext): {
  expression: ExpressionState
  isTalking: boolean
} {
  if (ctx.speechStatus === 'error') {
    return { expression: 'confused', isTalking: false }
  }
  if (ctx.isCelebrating) {
    return { expression: 'celebrating', isTalking: false }
  }
  if (ctx.speechStatus === 'speaking') {
    return { expression: 'speaking', isTalking: true }
  }
  if (ctx.isThinking) {
    return { expression: 'thinking', isTalking: false }
  }
  if (ctx.preferHappy) {
    return { expression: 'smile', isTalking: false }
  }
  if (ctx.isListening) {
    return { expression: 'listening', isTalking: false }
  }
  return { expression: ctx.expression, isTalking: false }
}
