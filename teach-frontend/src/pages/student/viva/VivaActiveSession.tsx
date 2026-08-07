/**
 * The active voice examination: avatar, conversation, and mic button.
 */

import { useEffect, useRef } from 'react'
import { Mic, Square, Volume2 } from 'lucide-react'
import SessionTutorStage from '../../../components/classroom/SessionTutorStage'
import { isVoiceCaptureSupported } from '../../../lib/voice/novaSonicAudio'
import type { useVivaVoiceSession } from '../../../hooks/useVivaVoiceSession'
import type { VivaTranscriptTurn } from '../../../hooks/useVivaVoiceSession'

interface VivaActiveSessionProps {
  hook: ReturnType<typeof useVivaVoiceSession>
  voiceAvailable: boolean | null
  errorMessage: string | null
  onStart: () => void
  onExit: () => void
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function VivaActiveSession({
  hook,
  voiceAvailable,
  errorMessage,
  onStart,
  onExit,
}: VivaActiveSessionProps) {
  const { status, isLive, transcript, micLevel, progress, maxQuestions } = hook
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)
  const canStart = status === 'idle' || status === 'error'

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [transcript])

  const answered = Math.min(progress.questionsAnswered, maxQuestions)
  const progressPct = (answered / Math.max(1, maxQuestions)) * 100
  const timeLow = isLive && progress.secondsRemaining <= 20

  return (
    <div className="viva-exp">
      {/* ─── Top Progress ─── */}
      <header className="viva-exp-header">
        <div className="viva-exp-progress-bar">
          <div className="viva-exp-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="viva-exp-header-meta">
          <span className="viva-exp-question-count">
            Question {answered} / {maxQuestions}
          </span>
          <span className={`viva-exp-timer${timeLow ? ' viva-exp-timer--low' : ''}`}>
            {formatTime(progress.secondsRemaining)}
          </span>
          <button className="viva-exp-exit" onClick={onExit} aria-label="End viva">
            <Square size={14} /> End
          </button>
        </div>
      </header>

      <div className="viva-exp-body">
        {/* ─── Left: Avatar ─── */}
        <aside className="viva-exp-avatar-panel">
          <SessionTutorStage
            speaking={status === 'examiner_speaking'}
            listening={status === 'listening' || status === 'student_speaking'}
            size="xl"
            statusLabel={
              status === 'examiner_speaking'
                ? 'Speaking'
                : status === 'student_speaking'
                  ? 'Listening'
                  : status === 'connecting'
                    ? 'Connecting…'
                    : isLive
                      ? 'Waiting for you'
                      : 'Ready'
            }
          />
        </aside>

        {/* ─── Center: Conversation ─── */}
        <main className="viva-exp-conversation">
          {errorMessage && (
            <div className="viva-exp-error-banner">{errorMessage}</div>
          )}

          {!isVoiceCaptureSupported() && (
            <div className="viva-exp-error-banner">
              Microphone not supported in this browser.
            </div>
          )}

          {voiceAvailable === false && (
            <div className="viva-exp-error-banner">
              Voice examinations are unavailable right now.
            </div>
          )}

          {transcript.length === 0 && !isLive && canStart && (
            <div className="viva-exp-empty">
              <div className="viva-exp-empty-icon">🎓</div>
              <h2>Spoken Viva</h2>
              <p>
                Your AI examiner will ask up to {maxQuestions} questions. Answer out loud —
                the examiner speaks first.
              </p>
              <button
                className="viva-exp-start-btn"
                onClick={onStart}
                disabled={voiceAvailable === false || !isVoiceCaptureSupported()}
              >
                <Mic size={20} />
                Begin Examination
              </button>
            </div>
          )}

          {transcript.length === 0 && isLive && (
            <div className="viva-exp-waiting">
              <div className="viva-exp-waiting-dots">
                <span /><span /><span />
              </div>
              <p>Examiner is preparing the first question…</p>
            </div>
          )}

          {transcript.length > 0 && (
            <div className="viva-exp-messages">
              {transcript.map((turn) => (
                <MessageCard key={turn.id} turn={turn} />
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </main>
      </div>

      {/* ─── Bottom: Mic Button ─── */}
      {isLive && (
        <footer className="viva-exp-mic-area">
          <div className={`viva-exp-mic-btn viva-exp-mic-btn--${status}`}>
            <div
              className="viva-exp-mic-ring"
              style={{ transform: `scale(${1 + micLevel * 0.5})` }}
            />
            <div className="viva-exp-mic-icon">
              {status === 'student_speaking' ? (
                <Mic size={28} />
              ) : status === 'examiner_speaking' ? (
                <Volume2 size={28} />
              ) : (
                <Mic size={28} />
              )}
            </div>
          </div>
          <span className="viva-exp-mic-label">
            {status === 'student_speaking'
              ? 'Listening to you…'
              : status === 'examiner_speaking'
                ? 'Examiner speaking…'
                : 'Your turn — speak now'}
          </span>
        </footer>
      )}
    </div>
  )
}

function MessageCard({ turn }: { turn: VivaTranscriptTurn }) {
  const isAI = turn.role === 'ASSISTANT'
  return (
    <div className={`viva-msg ${isAI ? 'viva-msg--ai' : 'viva-msg--student'}`}>
      <div className="viva-msg-icon">
        {isAI ? <Volume2 size={14} /> : <Mic size={14} />}
      </div>
      <div className="viva-msg-content">
        <span className="viva-msg-role">{isAI ? 'Examiner' : 'You'}</span>
        <p className="viva-msg-text">{turn.text}</p>
      </div>
    </div>
  )
}
