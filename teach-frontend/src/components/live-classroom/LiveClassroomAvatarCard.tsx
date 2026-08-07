import { memo } from 'react'
import { Pause, Play } from 'lucide-react'
import Icon from '../ui/Icon'
import LiveClassroomAvatarVisual from './LiveClassroomAvatarVisual'
import LiveClassroomSubtitleCard from './LiveClassroomSubtitleCard'

interface LiveClassroomAvatarCardProps {
  speaking: boolean
  listening: boolean
  thinking: boolean
  isPaused: boolean
  showPauseControl: boolean
  onTogglePause: () => void
  subtitle: string
}

function resolveStatus(speaking: boolean, listening: boolean, thinking: boolean, isPaused: boolean) {
  if (listening) {
    return { label: 'Listening', tone: 'listening' as const, cardLabel: 'Listening to you' }
  }
  if (thinking) {
    return { label: 'Thinking', tone: 'thinking' as const, cardLabel: 'Thinking' }
  }
  if (isPaused) {
    return { label: 'Paused', tone: 'speaking' as const, cardLabel: 'Paused' }
  }
  if (speaking) {
    return { label: 'Explaining', tone: 'speaking' as const, cardLabel: 'Explaining' }
  }
  return { label: 'Ready', tone: 'ready' as const, cardLabel: 'Ready to teach' }
}

function LiveClassroomAvatarCardInner({
  speaking,
  listening,
  thinking,
  isPaused,
  showPauseControl,
  onTogglePause,
  subtitle,
}: LiveClassroomAvatarCardProps) {
  const status = resolveStatus(speaking, listening, thinking, isPaused)
  const showWaveform = thinking || speaking || listening
  const displaySubtitle = subtitle.trim()
  const hasLiveSubtitle = displaySubtitle !== '' && (speaking || listening || thinking || isPaused)

  return (
    <section className="live-classroom-avatar-card" aria-label="Nova teacher">
      <LiveClassroomAvatarVisual
        speaking={speaking}
        listening={listening}
        thinking={thinking}
        statusLabel={status.label}
        statusTone={status.tone}
      />

      <LiveClassroomSubtitleCard
        cardLabel={status.cardLabel}
        subtitle={subtitle}
        isLive={hasLiveSubtitle}
        showWaveform={showWaveform}
        statusTone={status.tone}
      />

      {showPauseControl ? (
        <button
          type="button"
          className="live-classroom-avatar-card__pause"
          onClick={onTogglePause}
        >
          <Icon icon={isPaused ? Play : Pause} size={15} strokeWidth={2.25} />
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      ) : null}
    </section>
  )
}

const LiveClassroomAvatarCard = memo(LiveClassroomAvatarCardInner)
export default LiveClassroomAvatarCard
