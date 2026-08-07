import { MentorTutorDecorations, NovaTutor } from '../nova'
import { useMentor } from '../../context/MentorContext'
import { mentorVisualStyle } from '../../lib/tutor'
import type { ExpressionState } from '../../types/mentor.types'
import TutorVoiceWaveform from './TutorVoiceWaveform'

interface SessionTutorStageProps {
  speaking: boolean
  listening?: boolean
  size?: 'lg' | 'xl'
  statusLabel?: string
  subtitle?: string
}

export default function SessionTutorStage({
  speaking,
  listening = false,
  size = 'xl',
  statusLabel,
  subtitle,
}: SessionTutorStageProps) {
  const { tutor } = useMentor()
  const expression: ExpressionState = speaking
    ? 'speaking'
    : listening
      ? 'listening'
      : 'idle'
  const resolvedStatus =
    statusLabel ??
    (speaking
      ? `${tutor.name} is speaking`
      : listening
        ? `${tutor.name} is listening`
        : `${tutor.name} is your AI Tutor`)
  const resolvedSubtitle = subtitle?.trim() ?? ''

  return (
    <aside className="session-tutor-stage" aria-label={`${tutor.name} teaching`}>
      <div className="session-tutor-stage-identity">
        <span className="page-kicker">Your AI Tutor</span>
        <strong>{tutor.name}</strong>
      </div>
      <div
        className={`study-mentor study-mentor-${size === 'xl' ? 'xl' : 'lg'} study-mentor-${tutor.id} mentor-expr-${expression} has-glow${speaking ? ' is-speaking' : ''}${listening ? ' is-listening' : ''}`}
        style={mentorVisualStyle(tutor)}
        data-tutor-id={tutor.id}
      >
        <div className="study-mentor-stage">
          <NovaTutor
            speaking={speaking}
            speakingVisual={speaking}
            size={size}
            label={resolvedStatus}
          />
          <MentorTutorDecorations expression={expression} speaking={speaking} />
        </div>
      </div>
      {resolvedSubtitle !== '' ? (
        <p className="session-tutor-stage-subtitle">{resolvedSubtitle}</p>
      ) : null}
      <div
        className={`session-tutor-stage-status${speaking ? ' is-speaking' : ''}${listening ? ' is-listening' : ''}`}
        aria-live="polite"
      >
        {speaking || listening ? (
          <TutorVoiceWaveform
            active
            variant={listening ? 'listening' : 'active'}
            compact
            className="session-tutor-stage-wave"
          />
        ) : null}
        <span>{resolvedStatus}</span>
      </div>
    </aside>
  )
}
