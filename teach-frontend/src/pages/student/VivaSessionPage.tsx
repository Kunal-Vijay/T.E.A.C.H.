import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ear, Mic, MicOff, Square, Timer } from 'lucide-react'
import SessionTutorStage from '../../components/classroom/SessionTutorStage'
import VivaAssessmentPanel from '../../components/classroom/VivaAssessmentPanel'
import { AppPage, Button, ErrorState, PageAlert, PageSection } from '../../components/ui'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import { isVoiceCaptureSupported } from '../../lib/voice/novaSonicAudio'
import { useVivaVoiceSession } from '../../hooks/useVivaVoiceSession'
import type { LearningSessionResponse } from '../../types/learning.types'
import './vivaSession.css'

const STATUS_COPY: Record<string, string> = {
  idle: 'Press start — the examiner asks the first question.',
  connecting: 'Connecting to your examiner…',
  listening: 'Your turn — answer out loud.',
  student_speaking: 'Listening to you…',
  examiner_speaking: 'Examiner speaking — listen, then answer.',
  grading: 'Marking your answers…',
  ended: 'Viva complete.',
  error: 'Something went wrong.',
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const wholeMinutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${wholeMinutes}:${String(seconds).padStart(2, '0')}`
}

export default function VivaSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  const {
    status,
    isLive,
    isGrading,
    errorMessage,
    transcript,
    micLevel,
    progress,
    completionReason,
    assessment,
    assessmentError,
    maxQuestions,
    maxSeconds,
    setAssessment,
    start,
    stop,
  } = useVivaVoiceSession(sessionId)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [sessionResponse, healthResponse] = await Promise.all([
          learningSessionApi.get(sessionId),
          learningSessionApi.voiceHealth(),
        ])
        if (cancelled) {
          return
        }
        setSession(sessionResponse.data)
        setVoiceAvailable(healthResponse.data.voice_viva_available)

        // If this viva was already marked, show the result straight away rather
        // than inviting the student to redo it.
        if (
          sessionResponse.data.viva_assessment !== null &&
          sessionResponse.data.goal_status === 'completed'
        ) {
          try {
            const stored = await learningSessionApi.voiceVivaAssessment(sessionId)
            if (!cancelled) {
              setAssessment(stored.data)
            }
          } catch {
            // An older text-mode viva has no rubric to rebuild; ignore.
          }
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'viva_session' })
        const resolved = resolveDisplayedError(
          error,
          { component: 'VivaSessionPage', action: 'load' },
          'Failed to load viva',
        )
        if (resolved !== null) {
          setLoadError(resolved)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionId, setAssessment])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [transcript])

  const handleExit = useCallback(() => {
    void (async () => {
      if (isLive) {
        await stop()
      }
      navigate('/student')
    })()
  }, [isLive, navigate, stop])

  if (session === null) {
    return (
      <AppPage>
        <PageSection label="Loading viva">{loadError ?? 'Loading viva…'}</PageSection>
      </AppPage>
    )
  }

  const alreadyMarked = assessment !== null && !isLive && !isGrading
  const answered = Math.min(progress.questionsAnswered, maxQuestions)
  const timeLow = isLive && progress.secondsRemaining <= 20
  const canStart = status === 'idle' || status === 'error'

  return (
    <AppPage>
      <PageSection label="Viva session">
        <div className="live-session-header">
          <div>
            <p className="page-kicker">Know your understanding</p>
            <h1>Spoken viva</h1>
            <p>
              Up to {maxQuestions} questions or {formatClock(maxSeconds)}, whichever comes first.
              Your examiner speaks first — just answer out loud.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={handleExit}>
            Exit
          </Button>
        </div>

        {!isVoiceCaptureSupported() ? (
          <PageAlert>
            <ErrorState message="This browser cannot capture microphone audio. Try the latest Chrome, Edge or Safari." />
          </PageAlert>
        ) : null}

        {voiceAvailable === false ? (
          <PageAlert>
            <ErrorState message="Spoken vivas are unavailable right now. Please try again later or tell your teacher." />
          </PageAlert>
        ) : null}

        {loadError !== null ? (
          <PageAlert>
            <ErrorState message={loadError} onDismiss={() => setLoadError(null)} />
          </PageAlert>
        ) : null}

        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} />
          </PageAlert>
        ) : null}

        <div className="live-session-layout">
          <SessionTutorStage
            speaking={status === 'examiner_speaking'}
            listening={status === 'listening' || status === 'student_speaking'}
            statusLabel={STATUS_COPY[status] ?? STATUS_COPY.idle}
          />

          <div className="live-session-main">
            <div className="viva-controls">
              <span className="viva-status">
                <span className={`viva-status-dot viva-status-dot--${status}`} aria-hidden="true" />
                {STATUS_COPY[status] ?? STATUS_COPY.idle}
              </span>

              {isLive || progress.questionsAsked > 0 ? (
                <div className="viva-progress" aria-label="Viva progress">
                  <div className="viva-progress-track">
                    <div
                      className="viva-progress-fill"
                      style={{
                        width: `${Math.min(100, (answered / Math.max(1, maxQuestions)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="viva-progress-label">
                    {answered} of {maxQuestions} answered
                  </span>
                  <span className={`viva-clock${timeLow ? ' viva-clock--low' : ''}`}>
                    <Timer size={13} aria-hidden="true" />
                    {formatClock(progress.secondsRemaining)}
                  </span>
                </div>
              ) : null}

              {/* Mic level, so the student can see they are being heard. */}
              {isLive ? (
                <div className="viva-mic-meter" aria-hidden="true">
                  <div
                    className="viva-mic-meter-fill"
                    style={{ width: `${Math.min(100, micLevel * 140)}%` }}
                  />
                </div>
              ) : null}

              <div className="viva-actions">
                {canStart && !alreadyMarked ? (
                  <Button
                    type="button"
                    icon={Mic}
                    withIcon
                    disabled={voiceAvailable === false || !isVoiceCaptureSupported()}
                    onClick={() => void start()}
                  >
                    Start viva
                  </Button>
                ) : null}

                {status === 'connecting' ? (
                  <Button type="button" disabled>
                    Connecting…
                  </Button>
                ) : null}

                {isLive ? (
                  <Button type="button" variant="secondary" icon={Square} withIcon onClick={() => void stop()}>
                    End &amp; mark
                  </Button>
                ) : null}

                {alreadyMarked ? (
                  <Button type="button" variant="secondary" onClick={() => navigate('/student')}>
                    Back to topics
                  </Button>
                ) : null}
              </div>

              {completionReason !== null && assessment === null && assessmentError === null ? (
                <p className="viva-note">
                  {completionReason === 'time_limit'
                    ? 'Time is up — marking your answers…'
                    : completionReason === 'question_limit'
                      ? `That's all ${maxQuestions} questions — marking your answers…`
                      : 'Marking your answers…'}
                </p>
              ) : null}

              {isGrading && assessment === null ? (
                <p className="viva-note">Marking your answers — this takes a few seconds…</p>
              ) : null}

              {assessmentError !== null ? (
                <p className="viva-note viva-note--muted">{assessmentError}</p>
              ) : null}
            </div>

            {assessment !== null ? <VivaAssessmentPanel assessment={assessment} /> : null}

            <div className="viva-transcript">
              {transcript.length === 0 ? (
                <div className="viva-transcript-empty">
                  {isLive ? (
                    <>
                      <Ear size={18} aria-hidden="true" />
                      <span>Waiting for the examiner to ask the first question…</span>
                    </>
                  ) : (
                    <>
                      <MicOff size={18} aria-hidden="true" />
                      <span>Your conversation will appear here.</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {transcript.map((turn) => (
                    <div
                      key={turn.id}
                      className={`viva-turn viva-turn-${turn.role === 'USER' ? 'student' : 'tutor'}`}
                    >
                      <strong>{turn.role === 'USER' ? 'You' : 'Examiner'}</strong>
                      <p>{turn.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      </PageSection>
    </AppPage>
  )
}
