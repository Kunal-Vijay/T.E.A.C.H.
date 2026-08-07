import { memo } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import type { SpeechStatus } from '../avatar/SpeechController'
import { Button } from '../ui/Button'
import TutorThinkingDots from './TutorThinkingDots'

interface SyncedTutorTranscriptProps {
  fullText: string
  revealedText: string
  speechStatus: SpeechStatus
  isPaused: boolean
  canControlPlayback: boolean
  onTogglePause: () => void
  onReplay: () => void
}

function SyncedTutorTranscriptInner({
  fullText,
  revealedText,
  speechStatus,
  isPaused,
  canControlPlayback,
  onTogglePause,
  onReplay,
}: SyncedTutorTranscriptProps) {
  const trimmedFullText = fullText.trim()
  const trimmedRevealedText = revealedText.trim()
  const isLoadingSpeech = speechStatus === 'loading'
  const isSpeaking = speechStatus === 'speaking'
  const isPausedSpeech = speechStatus === 'paused'
  const isSpeechActive = isLoadingSpeech || isSpeaking || isPausedSpeech
  const showLiveTranscript = isSpeechActive
  const displayText = showLiveTranscript ? trimmedRevealedText : trimmedFullText
  const showPauseButton = canControlPlayback && trimmedFullText !== '' && isSpeechActive
  const showReplayButton = canControlPlayback && trimmedFullText !== '' && !isSpeechActive

  return (
    <div
      className={`synced-tutor-transcript${showLiveTranscript ? ' is-live' : ''}${isPausedSpeech ? ' is-paused' : ''}`}
      aria-live="polite"
    >
      <div className="synced-tutor-transcript-header">
        <p className="synced-tutor-transcript-label">Tutor</p>
        {canControlPlayback && trimmedFullText !== '' ? (
          <div className="synced-tutor-transcript-controls">
            {showPauseButton ? (
              <Button
                type="button"
                variant="secondary"
                icon={isPaused ? Play : Pause}
                onClick={onTogglePause}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            ) : null}
            {showReplayButton ? (
              <Button
                type="button"
                variant="ghost"
                icon={RotateCcw}
                onClick={onReplay}
              >
                Replay
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="synced-tutor-transcript-body">
        {isLoadingSpeech && trimmedRevealedText === '' ? (
          <p className="synced-tutor-transcript-loading">
            Preparing voice
            <TutorThinkingDots className="synced-tutor-transcript-loading-dots" />
          </p>
        ) : null}
        {displayText !== '' ? (
          <p className="synced-tutor-transcript-text">
            {displayText}
            {isSpeaking && !isPausedSpeech ? (
              <span className="synced-tutor-transcript-cursor" aria-hidden="true" />
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const SyncedTutorTranscript = memo(SyncedTutorTranscriptInner)
export default SyncedTutorTranscript
