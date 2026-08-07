import { resolveNovaSpeaking } from '../../lib/tutor/novaSpeaking'
import type { ExpressionState } from '../../types/mentor.types'

interface MentorTutorDecorationsProps {
  expression: ExpressionState
  speaking?: boolean
}

/** Non-avatar UI chrome — rings and confetti around NovaTutor. */
export default function MentorTutorDecorations({
  expression,
  speaking = false,
}: MentorTutorDecorationsProps) {
  const showCelebration = expression === 'celebrating' || expression === 'excited'
  const showSpeaking = resolveNovaSpeaking(expression, speaking)
  const showListening = expression === 'listening' || expression === 'curious'
  const showThinking = expression === 'thinking'

  return (
    <>
      {showCelebration ? (
        <>
          <span className="mentor-confetti mentor-confetti-a" aria-hidden="true" />
          <span className="mentor-confetti mentor-confetti-b" aria-hidden="true" />
          <span className="mentor-confetti mentor-confetti-c" aria-hidden="true" />
        </>
      ) : null}
      {showSpeaking ? (
        <span className="mentor-speak-ring" aria-hidden="true" />
      ) : null}
      {showListening ? (
        <span className="mentor-listen-ring" aria-hidden="true" />
      ) : null}
      {showThinking ? (
        <span className="mentor-think-pulse" aria-hidden="true" />
      ) : null}
    </>
  )
}
