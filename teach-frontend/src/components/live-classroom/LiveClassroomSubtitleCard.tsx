import { memo } from 'react'
import TutorThinkingDots from '../classroom/TutorThinkingDots'
import TutorVoiceWaveform from '../classroom/TutorVoiceWaveform'
import LiveClassroomSubtitle from './LiveClassroomSubtitle'

interface LiveClassroomSubtitleCardProps {
  cardLabel: string
  subtitle: string
  isLive: boolean
  showWaveform: boolean
  statusTone: 'speaking' | 'listening' | 'thinking' | 'ready'
}

function LiveClassroomSubtitleCardInner({
  cardLabel,
  subtitle,
  isLive,
  showWaveform,
  statusTone,
}: LiveClassroomSubtitleCardProps) {
  return (
    <div className={`live-classroom-avatar-card__subtitle-card${isLive ? ' is-live' : ''}`}>
      <p className="live-classroom-avatar-card__subtitle-label">
        💬 {cardLabel}
      </p>
      <LiveClassroomSubtitle text={subtitle} isLive={isLive} />
      {showWaveform ? (
        <div className={`live-classroom-avatar-card__wave-wrap live-classroom-avatar-card__wave-wrap--${statusTone}`}>
          {statusTone === 'thinking' ? (
            <TutorThinkingDots className="live-classroom-avatar-card__dots" />
          ) : (
            <TutorVoiceWaveform
              active
              variant={statusTone === 'listening' ? 'listening' : 'active'}
              compact
              className="live-classroom-avatar-card__wave"
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

const LiveClassroomSubtitleCard = memo(LiveClassroomSubtitleCardInner)
export default LiveClassroomSubtitleCard
