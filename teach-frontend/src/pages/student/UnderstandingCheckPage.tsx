import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Ear, Mic, MicOff, RotateCcw, Square, Timer } from 'lucide-react'
import {
  AppPage,
  Button,
  ErrorState,
  HubHero,
  LoadingSpinner,
  PageAlert,
  PageHeader,
  PageSection,
} from '../../components/ui'
import StatusPanel from '../../components/status/StatusPanel'
import UnderstandingFeedbackPanel from '../../components/understanding/UnderstandingFeedbackPanel'
import { useToast } from '../../context/ToastContext'
import { trackEvent } from '../../lib/analytics'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { understandingCheckApi } from '../../services/api/understandingCheckApi'
import { getClassroomSessionId } from '../../services/auth/authService'
import { useUnderstandingCheck } from '../../hooks/useUnderstandingCheck'
import { isVoiceCaptureSupported } from '../../lib/voice/novaSonicAudio'
import type {
  UnderstandingCheckTopic,
  UnderstandingCheckTopicList,
  UnderstandingFeedback,
} from '../../types/api.types'
import './understandingCheck.css'

const STATUS_COPY: Record<string, { label: string; hint: string }> = {
  idle: { label: 'Ready', hint: 'Your examiner asks the first question — just listen, then reply.' },
  connecting: { label: 'Connecting', hint: 'Setting up your examiner…' },
  listening: { label: 'Your turn', hint: 'Answer out loud.' },
  student_speaking: { label: 'Listening to you', hint: 'Keep going.' },
  tutor_speaking: { label: 'Examiner speaking', hint: 'Listen, then answer.' },
  ended: { label: 'Finished', hint: 'Viva complete.' },
  error: { label: 'Problem', hint: 'Something went wrong.' },
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function UnderstandingCheckPage() {
  const { generationId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { pushToast } = useToast()

  const [topicList, setTopicList] = useState<UnderstandingCheckTopicList | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string>(searchParams.get('topicId') ?? '')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [serverReady, setServerReady] = useState<boolean | null>(null)
  const [serverMessage, setServerMessage] = useState<string>('')

  const {
    status,
    isLive,
    errorMessage,
    transcript,
    micLevel,
    progress,
    completionReason,
    maxQuestions,
    maxSeconds,
    start,
    stop,
    reset,
  } = useUnderstandingCheck()
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  const [feedback, setFeedback] = useState<UnderstandingFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const autoRequestedRef = useRef(false)

  const classroomSessionId = useMemo(() => getClassroomSessionId(generationId), [generationId])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [topicsResponse, healthResponse] = await Promise.all([
          understandingCheckApi.listTopics(generationId),
          understandingCheckApi.health(),
        ])
        if (cancelled) {
          return
        }
        setTopicList(topicsResponse.data)
        setSelectedTopicId((current) =>
          current !== '' ? current : (topicsResponse.data.topics[0]?.topic_id ?? ''),
        )

        const health = healthResponse.data
        setServerReady(health.nova_sonic_configured && health.sdk_available)
        if (!health.sdk_available || !health.nova_sonic_configured) {
          // Deliberately vague: this is an operator problem, not a student one.
          setServerMessage(
            'Voice sessions are unavailable right now. Please try again later or tell your teacher.',
          )
        } else {
          setServerMessage('')
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'understanding_check', generationId })
        const message = resolveDisplayedError(
          error,
          { component: 'UnderstandingCheckPage', action: 'load_topics', generationId },
          'Could not load the topics for this class',
        )
        if (message !== null) {
          setLoadError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [generationId])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [transcript])

  const selectedTopic: UnderstandingCheckTopic | undefined = topicList?.topics.find(
    (topic) => topic.topic_id === selectedTopicId,
  )

  const handleStart = useCallback(async () => {
    if (selectedTopicId === '') {
      pushToast('Choose which topic to be tested on first.', 'info')
      return
    }
    setFeedback(null)
    autoRequestedRef.current = false
    await start({ generationId, topicId: selectedTopicId, classroomSessionId })
  }, [classroomSessionId, generationId, pushToast, selectedTopicId, start])

  const requestFeedback = useCallback(async () => {
    if (selectedTopicId === '' || feedbackLoading) {
      return
    }
    setFeedbackLoading(true)
    try {
      const response = await understandingCheckApi.requestFeedback({
        generation_id: generationId,
        topic_id: selectedTopicId,
        classroom_session_id: classroomSessionId,
        transcript: transcript.map((turn) => ({ role: turn.role, text: turn.text })),
        seconds_elapsed: progress.secondsElapsed,
      })
      setFeedback(response.data)
      trackEvent('understanding_feedback_generated', {
        generationId,
        grasp: response.data.grasp_level,
        score: response.data.overall_score,
      })
    } catch (error) {
      captureException(error, { action: 'understanding_feedback', generationId })
      const message = resolveDisplayedError(
        error,
        { component: 'UnderstandingCheckPage', action: 'request_feedback', generationId },
        'Could not build your assessment',
      )
      if (message !== null) {
        pushToast(message, 'error')
      }
    } finally {
      setFeedbackLoading(false)
    }
  }, [
    classroomSessionId,
    feedbackLoading,
    generationId,
    progress.secondsElapsed,
    pushToast,
    selectedTopicId,
    transcript,
  ])

  // The server decides when the viva is over (10 questions or 2 minutes). When it
  // says so, close the mic and grade. Guarded by a ref so it runs once per session.
  useEffect(() => {
    if (completionReason === null || autoRequestedRef.current) {
      return
    }
    autoRequestedRef.current = true
    void (async () => {
      await stop()
      await requestFeedback()
    })()
  }, [completionReason, requestFeedback, stop])

  const statusCopy = STATUS_COPY[status] ?? STATUS_COPY.idle
  const answered = Math.min(progress.questionsAnswered, maxQuestions)
  const timeLow = isLive && progress.secondsRemaining <= 20

  if (loading) {
    return (
      <AppPage variant="student">
        <div className="uc-loading">
          <LoadingSpinner />
          <p>Loading this class…</p>
        </div>
      </AppPage>
    )
  }

  if (loadError !== null) {
    return (
      <AppPage variant="student">
        <PageAlert>
          <ErrorState message={loadError} />
        </PageAlert>
      </AppPage>
    )
  }

  if (topicList !== null && topicList.topics.length === 0) {
    return (
      <AppPage variant="student">
        <StatusPanel
          tone="empty"
          title="Nothing to review yet."
          description="This class has no generated topics, so there is nothing to be tested on."
        />
      </AppPage>
    )
  }

  const multipleTopics = (topicList?.topics.length ?? 0) > 1

  return (
    <AppPage variant="student">
      <HubHero>
        <PageHeader
          variant="hub"
          kicker="Spoken viva"
          title="Check your understanding"
          lede={`A short spoken viva on what you just studied — up to ${maxQuestions} questions or ${Math.round(
            maxSeconds / 60,
          )} minutes, whichever comes first. Your examiner speaks first, then you answer out loud.`}
        />
      </HubHero>

      {!isVoiceCaptureSupported() ? (
        <PageAlert>
          <ErrorState message="This browser cannot capture microphone audio. Try the latest Chrome, Edge or Safari." />
        </PageAlert>
      ) : null}

      {serverReady === false ? (
        <PageAlert>
          <ErrorState message={serverMessage} />
        </PageAlert>
      ) : null}

      {errorMessage !== null ? (
        <PageAlert>
          <ErrorState message={errorMessage} onDismiss={() => void reset()} />
        </PageAlert>
      ) : null}

      <PageSection label="Topic from this class">
        <p className="uc-section-hint">
          {multipleTopics
            ? 'Which topic from this class should the viva cover?'
            : 'This class covers one topic, shown below.'}
        </p>
        <div className="uc-topics" role="radiogroup" aria-label="Topic from this class">
          {topicList?.topics.map((topic) => {
            const active = topic.topic_id === selectedTopicId
            return (
              <button
                key={topic.topic_id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isLive}
                className={`uc-topic-chip${active ? ' uc-topic-chip--active' : ''}`}
                onClick={() => setSelectedTopicId(topic.topic_id)}
              >
                <span className="uc-topic-title">{topic.title}</span>
                <span className="uc-topic-meta">{topic.slide_count} slides covered in class</span>
              </button>
            )
          })}
        </div>
      </PageSection>

      <PageSection label="Viva">
        <div className="uc-stage">
          <div className={`uc-orb uc-orb--${status}`} aria-hidden="true">
            <div className="uc-orb-core" />
            <div
              className="uc-orb-ring"
              style={{ transform: `scale(${1 + Math.min(micLevel, 1) * 0.45})` }}
            />
          </div>

          <div className="uc-stage-body">
            <p className="uc-status" role="status" aria-live="polite">
              <span className={`uc-status-dot uc-status-dot--${status}`} aria-hidden="true" />
              <strong>{statusCopy.label}</strong>
              <span className="uc-status-hint">{statusCopy.hint}</span>
            </p>

            {selectedTopic !== undefined ? (
              <p className="uc-subject">
                {topicList?.class_title} · {selectedTopic.title}
              </p>
            ) : null}

            {isLive || progress.questionsAsked > 0 ? (
              <div className="uc-progress" aria-label="Viva progress">
                <div className="uc-progress-track">
                  <div
                    className="uc-progress-fill"
                    style={{
                      width: `${Math.min(100, (answered / Math.max(1, maxQuestions)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="uc-progress-label">
                  {answered} of {maxQuestions} answered
                </span>
                <span
                  className={`uc-clock${timeLow ? ' uc-clock--low' : ''}`}
                  aria-label={`${formatClock(progress.secondsRemaining)} remaining`}
                >
                  <Timer size={13} aria-hidden="true" />
                  {formatClock(progress.secondsRemaining)}
                </span>
              </div>
            ) : null}

            {completionReason !== null ? (
              <p className="uc-complete-note">
                {completionReason === 'time_limit'
                  ? 'Time is up — marking your answers now.'
                  : `That's all ${maxQuestions} questions — marking your answers now.`}
              </p>
            ) : null}

            <div className="uc-actions">
              {!isLive && status !== 'connecting' ? (
                <Button
                  variant="primary"
                  icon={Mic}
                  onClick={() => void handleStart()}
                  disabled={serverReady === false || selectedTopicId === ''}
                >
                  {status === 'ended' ? 'Start another viva' : 'Start viva'}
                </Button>
              ) : null}

              {status === 'connecting' ? (
                <Button variant="primary" disabled>
                  Connecting…
                </Button>
              ) : null}

              {isLive ? (
                <Button variant="secondary" icon={Square} onClick={() => void stop()}>
                  End early
                </Button>
              ) : null}

              {progress.questionsAnswered > 0 && feedback === null && completionReason === null ? (
                <Button
                  variant="secondary"
                  icon={ClipboardCheck}
                  loading={feedbackLoading}
                  disabled={feedbackLoading}
                  onClick={() => {
                    autoRequestedRef.current = true
                    void (async () => {
                      if (isLive) {
                        await stop()
                      }
                      await requestFeedback()
                    })()
                  }}
                >
                  {feedbackLoading ? 'Marking…' : 'Mark me now'}
                </Button>
              ) : null}

              {transcript.length > 0 && !isLive ? (
                <Button variant="ghost" icon={RotateCcw} onClick={() => void reset()}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </PageSection>

      {feedbackLoading || feedback !== null ? (
        <PageSection label="Your assessment">
          {feedbackLoading ? (
            <div className="uc-feedback-loading">
              <LoadingSpinner />
              <p>Marking your answers…</p>
            </div>
          ) : feedback !== null ? (
            <UnderstandingFeedbackPanel feedback={feedback} />
          ) : null}
        </PageSection>
      ) : null}

      <PageSection label="Transcript">
        {transcript.length === 0 ? (
          <div className="uc-transcript-empty">
            {isLive ? (
              <>
                <Ear size={18} aria-hidden="true" />
                <span>Waiting for your examiner to ask the first question…</span>
              </>
            ) : (
              <>
                <MicOff size={18} aria-hidden="true" />
                <span>Your conversation will appear here.</span>
              </>
            )}
          </div>
        ) : (
          <div className="uc-transcript">
            {transcript.map((turn) => (
              <div
                key={turn.id}
                className={`uc-turn uc-turn--${turn.role === 'USER' ? 'student' : 'tutor'}`}
              >
                <span className="uc-turn-who">{turn.role === 'USER' ? 'You' : 'Examiner'}</span>
                <p className="uc-turn-text">{turn.text}</p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </PageSection>
    </AppPage>
  )
}
