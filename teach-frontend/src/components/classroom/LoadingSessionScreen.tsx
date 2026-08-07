import { useEffect, useState } from 'react'
import { NovaTutor } from '../nova'
import { Button } from '../ui'
import { pickPreparingMessage, PREPARING_MESSAGE_ROTATE_MS } from '../../lib/sessionFirstTurn'
import { LEARNING_MODE_LABELS, type LearningMode } from '../../types/learning.types'
import '../../styles/loading-session-screen.css'

const MESSAGE_FADE_MS = 220

export interface LoadingSessionScreenProps {
  mode: LearningMode
  failed?: boolean
  errorMessage?: string | null
  retrying?: boolean
  exiting?: boolean
  onRetry?: () => void
  onExit: () => void
}

export default function LoadingSessionScreen({
  mode,
  failed = false,
  errorMessage = null,
  retrying = false,
  exiting = false,
  onRetry,
  onExit,
}: LoadingSessionScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFading, setMessageFading] = useState(false)

  useEffect(() => {
    if (failed) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setMessageFading(true)
      window.setTimeout(() => {
        setMessageIndex((current) => current + 1)
        setMessageFading(false)
      }, MESSAGE_FADE_MS)
    }, PREPARING_MESSAGE_ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [failed])

  const preparingMessage = pickPreparingMessage(messageIndex)

  return (
    <div
      className={`loading-session-screen${exiting ? ' loading-session-screen--exiting' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-session-screen__toolbar">
        <Button
          type="button"
          variant="ghost"
          className="loading-session-screen__exit"
          onClick={onExit}
        >
          Exit
        </Button>
      </div>

      <div className="loading-session-screen__body">
        <div className="loading-session-screen__stack">
          <header className="loading-session-screen__intro">
            <p className="loading-session-screen__kicker">{LEARNING_MODE_LABELS[mode]}</p>
            <h1 className="loading-session-screen__title">Live Session</h1>
            <p className="loading-session-screen__subtitle">
              {failed ? 'Something went wrong' : 'Preparing your lesson…'}
            </p>
          </header>

          {failed ? (
            <div className="loading-session-screen__card loading-session-screen__card--error">
              <p className="loading-session-screen__card-title">Nova couldn&apos;t prepare the lesson.</p>
              <p className="loading-session-screen__card-detail">
                {errorMessage ?? 'The lesson setup hit a snag. You can try again or pick another topic.'}
              </p>
              <div className="loading-session-screen__actions">
                <Button type="button" disabled={retrying} onClick={() => onRetry?.()}>
                  {retrying ? 'Retrying…' : 'Retry'}
                </Button>
                <Button type="button" variant="secondary" onClick={onExit}>
                  Return to Topics
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="loading-session-screen__avatar-block">
                <div className="loading-session-screen__halo" aria-hidden="true" />
                <NovaTutor preparing size="xl" speaking={false} label="" className="loading-session-screen__avatar" />
              </div>

              <div className="loading-session-screen__card" aria-atomic="true">
                <div
                  className={`loading-session-screen__card-copy${messageFading ? ' is-fading' : ''}`}
                >
                  <p className="loading-session-screen__card-title">{preparingMessage.headline}</p>
                  <p className="loading-session-screen__card-detail">{preparingMessage.detail}</p>
                </div>
              </div>

              <div className="loading-session-screen__progress" aria-hidden="true">
                <div className="loading-session-screen__progress-bar">
                  <span className="loading-session-screen__progress-fill" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
