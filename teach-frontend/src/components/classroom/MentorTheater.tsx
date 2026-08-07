import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import { mentorVisualStyle, resolveNovaSpeaking } from '../../lib/tutor'
import type { TutorPresence } from '../../lib/tutor/tutorPresence'
import { MentorTutorDecorations, NovaTutor } from '../nova'
import TutorThinkingDots from './TutorThinkingDots'
import TutorVoiceWaveform from './TutorVoiceWaveform'

interface MentorTheaterProps {
  mentor: MentorDefinition
  expression: ExpressionState
  isTalking?: boolean
  showSpeaking: boolean
  tutorPresence: TutorPresence
  hasStarted: boolean
  beatPhase?: string
}

export default function MentorTheater({
  mentor,
  expression,
  isTalking = false,
  showSpeaking,
  tutorPresence,
  hasStarted,
  beatPhase,
}: MentorTheaterProps) {
  const mode = tutorPresence.mode

  const resolvedExpression: ExpressionState = showSpeaking
    ? 'speaking'
    : mode === 'listening'
      ? 'listening'
      : mode === 'thinking' || !hasStarted
        ? 'thinking'
        : beatPhase === 'recap'
          ? 'celebrating'
          : beatPhase === 'reveal'
            ? 'explaining'
            : expression

  const decorationSpeaking = showSpeaking || resolveNovaSpeaking(resolvedExpression, isTalking)
  const label = showSpeaking
    ? `${mentor.name} is speaking`
    : mode === 'listening'
      ? `${mentor.name} is listening`
      : mode === 'thinking'
        ? `${mentor.name} is thinking`
        : `${mentor.name} is your AI Tutor`

  const showLiveBadge = mode === 'speaking' || mode === 'listening' || mode === 'thinking'

  return (
    <div
      className={`mentor-theater${showSpeaking ? ' is-speaking' : ''}${mode === 'listening' ? ' is-listening' : ''}${mode === 'thinking' ? ' is-thinking' : ''}`}
      aria-label={`${mentor.name} teaching`}
    >
      <div className="mentor-theater-ambient" aria-hidden="true" />
      <div className="mentor-theater-ring mentor-theater-ring-a" aria-hidden="true" />
      <div className="mentor-theater-ring mentor-theater-ring-b" aria-hidden="true" />
      <div
        className={`study-mentor study-mentor-xl study-mentor-${mentor.id} mentor-expr-${resolvedExpression} has-glow`}
        style={mentorVisualStyle(mentor)}
        data-tutor-id={mentor.id}
      >
        <div className="study-mentor-stage">
          <NovaTutor
            speaking={showSpeaking}
            speakingVisual={showSpeaking}
            size="xl"
            label={label}
          />
          <MentorTutorDecorations expression={resolvedExpression} speaking={decorationSpeaking} />
        </div>
      </div>
      {showLiveBadge ? (
        <div className={`mentor-theater-live mentor-theater-live--${mode}`} aria-live="polite">
          {mode === 'speaking' ? (
            <TutorVoiceWaveform active variant="active" compact className="mentor-theater-live-wave" />
          ) : null}
          {mode === 'listening' ? (
            <TutorVoiceWaveform active variant="listening" compact className="mentor-theater-live-wave" />
          ) : null}
          {mode === 'thinking' ? (
            <TutorThinkingDots className="mentor-theater-live-thinking" />
          ) : null}
          {mode === 'speaking' ? <span className="mentor-theater-live-dot" aria-hidden="true" /> : null}
          {tutorPresence.label}
        </div>
      ) : null}
    </div>
  )
}
