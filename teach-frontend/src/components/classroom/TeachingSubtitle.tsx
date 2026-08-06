import { memo, useEffect, useMemo, useRef } from 'react'
import { highlightKeywords } from '../../lib/classroom/keywordHighlight'
import type { TutorPresence } from '../../lib/tutor/tutorPresence'
import TutorThinkingDots from './TutorThinkingDots'
import TutorVoiceWaveform from './TutorVoiceWaveform'

interface TeachingSubtitleProps {
  mentorName: string
  currentCue: string
  previousCue?: string
  cueIndex: number
  totalCues: number
  showSpeaking: boolean
  tutorPresence: TutorPresence
  hasStarted: boolean
  highlightWords?: string[]
}

function TeachingSubtitleInner({
  mentorName,
  currentCue,
  previousCue = '',
  cueIndex,
  totalCues,
  showSpeaking,
  tutorPresence,
  hasStarted,
  highlightWords = [],
}: TeachingSubtitleProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const mode = tutorPresence.mode

  const currentContent = useMemo(() => {
    const text = currentCue.trim()
    if (text === '') {
      return '…'
    }
    if (showSpeaking && highlightWords.length > 0) {
      return highlightKeywords(text, highlightWords, 'teaching-subtitle-kw')
    }
    return text
  }, [currentCue, highlightWords, showSpeaking])

  useEffect(() => {
    const node = bodyRef.current
    if (node === null) {
      return
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [currentCue, cueIndex])

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

  const progressPct = totalCues > 0 ? ((cueIndex + 1) / totalCues) * 100 : 0

  return (
    <div
      className={`teaching-subtitle teaching-subtitle-live${showSpeaking ? ' is-speaking' : ''}${mode === 'listening' ? ' is-listening' : ''}${mode === 'thinking' ? ' is-thinking' : ''}`}
      aria-live="polite"
    >
      <div className="teaching-subtitle-header">
        <p className={`teaching-subtitle-kicker${showSpeaking || mode === 'listening' ? ' teaching-subtitle-kicker--live' : ''}`}>
          {showSpeaking ? (
            <>
              <TutorVoiceWaveform active variant="active" compact className="teaching-subtitle-wave" />
              <span className="teaching-subtitle-live-dot" aria-hidden="true" />
            </>
          ) : null}
          {mode === 'listening' ? (
            <TutorVoiceWaveform active variant="listening" compact className="teaching-subtitle-wave" />
          ) : null}
          {mode === 'thinking' ? <TutorThinkingDots className="teaching-subtitle-thinking" /> : null}
          {tutorPresence.label}
        </p>
      </div>

      <div className="teaching-subtitle-body" ref={bodyRef}>
        {previousCue.trim() !== '' ? (
          <p key={`prev-${cueIndex - 1}`} className="teaching-subtitle-prev" aria-hidden="true">
            {previousCue}
          </p>
        ) : null}
        <p key={`cur-${cueIndex}`} className="teaching-subtitle-current">
          {currentContent}
        </p>
      </div>

      {totalCues > 1 ? (
        <div className="teaching-subtitle-footer">
          <span className="teaching-subtitle-cue">
            Moment {cueIndex + 1} of {totalCues}
          </span>
          <div className="teaching-subtitle-track" aria-hidden="true">
            <div
              className={`teaching-subtitle-track-fill${showSpeaking ? ' is-active' : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

const TeachingSubtitle = memo(TeachingSubtitleInner)
export default TeachingSubtitle
