import { highlightKeywords } from '../../lib/classroom/keywordHighlight'

interface TeachingSubtitleProps {
  mentorName: string
  currentCue: string
  previousCue?: string
  keywords: string[]
  cueIndex: number
  totalCues: number
  isSpeaking: boolean
  hasStarted: boolean
}

export default function TeachingSubtitle({
  mentorName,
  currentCue,
  previousCue = '',
  keywords,
  cueIndex,
  totalCues,
  isSpeaking,
  hasStarted,
}: TeachingSubtitleProps) {
  if (!hasStarted && currentCue.trim() === '') {
    return (
      <div className="teaching-subtitle teaching-subtitle-idle" aria-live="polite">
        <p className="teaching-subtitle-waiting">
          {mentorName} is ready — tap begin when you are
        </p>
      </div>
    )
  }

  return (
    <div
      className={`teaching-subtitle${isSpeaking ? ' is-speaking' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {previousCue.trim() !== '' ? (
        <p className="teaching-subtitle-prev" aria-hidden="true">
          {previousCue}
        </p>
      ) : null}
      <p className="teaching-subtitle-current">
        {currentCue.trim() !== '' ? highlightKeywords(currentCue, keywords) : '…'}
      </p>
      {totalCues > 1 ? (
        <div className="teaching-subtitle-track" aria-hidden="true">
          <div
            className="teaching-subtitle-track-fill"
            style={{ width: `${((cueIndex + 1) / totalCues) * 100}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
