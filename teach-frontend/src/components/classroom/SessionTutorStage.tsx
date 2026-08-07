import { Pause, Play } from 'lucide-react'
import { MentorTutorDecorations, NovaTutor } from '../nova'
import { useMentor } from '../../context/MentorContext'
import { mentorVisualStyle } from '../../lib/tutor'
import type { ExpressionState } from '../../types/mentor.types'
import type { LearningMode } from '../../types/learning.types'
import { Button } from '../ui/Button'
import NovaSessionStatus from './NovaSessionStatus'
import TutorThinkingDots from './TutorThinkingDots'
import TutorVoiceWaveform from './TutorVoiceWaveform'

interface SessionTutorStageProps {
  speaking: boolean
  listening?: boolean
  preparing?: boolean
  submitting?: boolean
  liveCaption?: string
  mode?: LearningMode
  size?: 'lg' | 'xl'
  statusLabel?: string
  subtitle?: string
  showPauseControl?: boolean
  isPaused?: boolean
  onTogglePause?: () => void
}

export default function SessionTutorStage({
  speaking,
  listening = false,
  preparing = false,
  submitting = false,
  liveCaption = '',
  mode = 'teach',
  size = 'xl',
  statusLabel,
  subtitle,
  showPauseControl = false,
  isPaused = false,
  onTogglePause,
}: SessionTutorStageProps) {
  const { tutor } = useMentor()
  const expression: ExpressionState = preparing
    ? 'thinking'
    : speaking
      ? 'speaking'
      : listening
        ? 'listening'
        : submitting
          ? 'thinking'
          : 'idle'
  const showSpeakingVisual = !preparing && speaking
  const resolvedSubtitle = subtitle?.trim() ?? ''
  const canTogglePause = showPauseControl && onTogglePause != null

  return (
    <aside className="session-tutor-stage" aria-label={`${tutor.name} teaching`}>
      <div className="session-tutor-stage-identity">
        <span className="page-kicker">Your AI Tutor</span>
        <strong>{tutor.name}</strong>
      </div>
      <div
        className={`study-mentor study-mentor-${size === 'xl' ? 'xl' : 'lg'} study-mentor-${tutor.id} mentor-expr-${expression} has-glow${showSpeakingVisual ? ' is-speaking' : ''}${listening ? ' is-listening' : ''}${preparing ? ' is-preparing' : ''}`}
        style={mentorVisualStyle(tutor)}
        data-tutor-id={tutor.id}
      >
        <div className="study-mentor-stage">
          <NovaTutor
            speaking={showSpeakingVisual}
            speakingVisual={showSpeakingVisual}
            preparing={preparing}
            size={size}
            label=""
          />
          <MentorTutorDecorations expression={expression} speaking={showSpeakingVisual} />
        </div>
      </div>
      {resolvedSubtitle !== '' ? (
        <p className="session-tutor-stage-subtitle">{resolvedSubtitle}</p>
      ) : null}
      {canTogglePause ? (
        <div className="session-tutor-stage-controls">
          <Button
            type="button"
            variant="secondary"
            icon={isPaused ? Play : Pause}
            onClick={onTogglePause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      ) : null}
      <div
        className={`session-tutor-stage-status${showSpeakingVisual ? ' is-speaking' : ''}${listening ? ' is-listening' : ''}${preparing ? ' is-preparing' : ''}`}
      >
        {preparing ? (
          <>
            <TutorThinkingDots className="session-tutor-stage-thinking" />
            {statusLabel != null ? <span>{statusLabel}</span> : null}
          </>
        ) : (
          <>
            {showSpeakingVisual || listening ? (
              <TutorVoiceWaveform
                active
                variant={listening ? 'listening' : 'active'}
                compact
                className="session-tutor-stage-wave"
              />
            ) : null}
            <NovaSessionStatus
              isSpeaking={showSpeakingVisual}
              isListening={listening}
              isSubmitting={submitting}
              liveCaption={liveCaption}
              mode={mode}
            />
          </>
        )}
      </div>
    </aside>
  )
}
