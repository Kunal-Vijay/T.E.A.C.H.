import type { AvatarMachineInput } from '../avatar/AvatarMachineState'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'

interface MentorTheaterProps {
  mentor: MentorDefinition
  expression: ExpressionState
  avatarInput?: AvatarMachineInput
  isSpeaking: boolean
  hasStarted: boolean
  beatPhase?: string
}

export default function MentorTheater({
  mentor,
  expression,
  avatarInput,
  isSpeaking,
  hasStarted,
  beatPhase,
}: MentorTheaterProps) {
  const resolvedExpression: ExpressionState = isSpeaking
    ? 'speaking'
    : !hasStarted
      ? 'thinking'
      : beatPhase === 'recap'
        ? 'celebrating'
        : beatPhase === 'reveal'
          ? 'explaining'
          : expression

  return (
    <div className="mentor-theater" aria-label={`${mentor.name} teaching`}>
      <div className="mentor-theater-ambient" aria-hidden="true" />
      <div className="mentor-theater-ring mentor-theater-ring-a" aria-hidden="true" />
      <div className="mentor-theater-ring mentor-theater-ring-b" aria-hidden="true" />
      <StudyMentorAvatar
        mentor={mentor}
        expression={resolvedExpression}
        avatarInput={avatarInput}
        isTalking={isSpeaking}
        size="hero"
        showGlow
        ariaLabel={`${mentor.name} is your AI Tutor`}
      />
      {isSpeaking ? (
        <div className="mentor-theater-live" aria-hidden="true">
          <span className="mentor-theater-live-dot" />
          Teaching
        </div>
      ) : null}
    </div>
  )
}
