import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import NovaThinkingStage from './NovaThinkingStage'
import { pickPreparingMessage, PREPARING_MESSAGE_ROTATE_MS } from '../../lib/sessionFirstTurn'
import { LEARNING_MODE_LABELS, type LearningMode } from '../../types/learning.types'

interface SessionPreparingViewProps {
  mode: LearningMode
  failed?: boolean
  errorMessage?: string | null
  retrying?: boolean
  exiting?: boolean
  onRetry?: () => void
}

export default function SessionPreparingView({
  mode,
  failed = false,
  errorMessage = null,
  retrying = false,
  onRetry,
}: SessionPreparingViewProps) {
  const navigate = useNavigate()
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (failed) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setMessageIndex((current) => current + 1)
    }, PREPARING_MESSAGE_ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [failed])

  const preparingMessage = pickPreparingMessage(messageIndex)

  return (
    <div className="session-preparing-shell">
      <div className="live-session-header">
        <div>
          <p className="page-kicker">{LEARNING_MODE_LABELS[mode]}</p>
          <h1>Live session</h1>
          <p className="session-preparing-phase">
            {failed ? 'Something went wrong' : 'Nova is reviewing your lesson notes…'}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/student')}>
          Exit
        </Button>
      </div>

      {failed ? (
        <div className="session-preparing-layout">
          <div className="session-preparing-panel is-failed">
            <p className="session-preparing-headline">Nova couldn&apos;t prepare the lesson.</p>
            {errorMessage != null ? (
              <p className="session-preparing-detail">{errorMessage}</p>
            ) : (
              <p className="session-preparing-detail">
                The lesson setup hit a snag. You can try again or pick another topic.
              </p>
            )}
            <div className="session-preparing-actions">
              <Button type="button" disabled={retrying} onClick={() => onRetry?.()}>
                {retrying ? 'Retrying…' : 'Retry'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/student')}>
                Return to Topics
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="session-preparing-layout">
          <NovaThinkingStage
            statusLabel={preparingMessage.headline}
            detail={preparingMessage.detail}
          />
          <div className="session-preparing-progress-track" aria-hidden="true">
            <span className="session-preparing-shimmer" />
            <span className="session-preparing-dots">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
