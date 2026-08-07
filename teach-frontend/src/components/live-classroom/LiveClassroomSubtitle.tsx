import { memo } from 'react'

interface LiveClassroomSubtitleProps {
  text: string
  isLive: boolean
}

const IDLE_TEXT = 'Nova will explain the lesson here as she teaches.'

function LiveClassroomSubtitleInner({ text, isLive }: LiveClassroomSubtitleProps) {
  const display = text.trim()

  return (
    <div className="live-classroom-avatar-card__subtitle-viewport" aria-live="polite" aria-atomic="true">
      {isLive && display !== '' ? (
        <p className="live-classroom-avatar-card__subtitle live-classroom-avatar-card__subtitle-live">
          &ldquo;{display}&rdquo;
        </p>
      ) : (
        <p className="live-classroom-avatar-card__subtitle live-classroom-avatar-card__subtitle--idle">
          {IDLE_TEXT}
        </p>
      )}
    </div>
  )
}

const LiveClassroomSubtitle = memo(LiveClassroomSubtitleInner)
export default LiveClassroomSubtitle
