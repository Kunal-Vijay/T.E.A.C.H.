interface TeachingSubtitleProps {
  mentorName: string
  currentCue: string
  previousCue?: string
  cueIndex: number
  totalCues: number
  isSpeaking: boolean
  hasStarted: boolean
}

export default function TeachingSubtitle({
  mentorName,
  currentCue,
  previousCue = '',
  cueIndex,
  totalCues,
  isSpeaking,
  hasStarted,
}: TeachingSubtitleProps) {
  if (!hasStarted && currentCue.trim() === '') {
    return (
      <div className="teaching-subtitle teaching-subtitle-idle" aria-live="polite">
        <p className="teaching-subtitle-kicker">Before we begin</p>
        <p className="teaching-subtitle-waiting">
          {mentorName} is ready — start the lesson when you are.
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
        {currentCue.trim() !== '' ? currentCue : '…'}
      </p>
      {totalCues > 1 ? (
        <div className="teaching-subtitle-footer">
          <span className="teaching-subtitle-cue">
            Moment {cueIndex + 1} of {totalCues}
          </span>
          <div className="teaching-subtitle-track" aria-hidden="true">
            <div
              className="teaching-subtitle-track-fill"
              style={{ width: `${((cueIndex + 1) / totalCues) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
