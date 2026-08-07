import { memo } from 'react'
import { MentorTutorDecorations, NovaTutor } from '../nova'
import { useMentor } from '../../context/MentorContext'
import { mentorVisualStyle } from '../../lib/tutor'

interface LiveClassroomAvatarVisualProps {
  speaking: boolean
  listening: boolean
  thinking: boolean
  statusLabel: string
  statusTone: 'speaking' | 'listening' | 'thinking' | 'ready'
}

function LiveClassroomAvatarVisualInner({
  speaking,
  listening,
  thinking,
  statusLabel,
  statusTone,
}: LiveClassroomAvatarVisualProps) {
  const { tutor } = useMentor()
  const showSpeakingVisual = speaking && !thinking
  const expression = thinking
    ? 'thinking'
    : speaking
      ? 'speaking'
      : listening
        ? 'listening'
        : 'idle'

  return (
    <>
      <p className="live-classroom-avatar-card__label">{tutor.name.toUpperCase()}</p>

      <div
        className={`live-classroom-avatar-card__stage study-mentor study-mentor-lg study-mentor-${tutor.id} mentor-expr-${expression} has-glow${showSpeakingVisual ? ' is-speaking' : ''}${listening ? ' is-listening' : ''}`}
        style={mentorVisualStyle(tutor)}
      >
        <div className="study-mentor-stage">
          <NovaTutor
            speaking={showSpeakingVisual}
            speakingVisual={showSpeakingVisual}
            size="lg"
            label=""
          />
          <MentorTutorDecorations expression={expression} speaking={showSpeakingVisual} />
        </div>
      </div>

      <span className={`live-classroom-avatar-card__badge live-classroom-avatar-card__badge--${statusTone}`}>
        <span className="live-classroom-avatar-card__badge-dot" aria-hidden="true" />
        {statusLabel}
      </span>
    </>
  )
}

const LiveClassroomAvatarVisual = memo(LiveClassroomAvatarVisualInner)
export default LiveClassroomAvatarVisual
