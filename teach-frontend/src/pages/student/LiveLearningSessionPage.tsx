import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LearningWhiteboard from '../../components/classroom/LearningWhiteboard'
import SessionTutorStage from '../../components/classroom/SessionTutorStage'
import { AppPage, Button, ErrorState, PageAlert, PageSection } from '../../components/ui'
import { useSpeech } from '../../hooks/useSpeech'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import type { LearningSessionResponse } from '../../types/learning.types'
import { LEARNING_MODE_LABELS } from '../../types/learning.types'

export default function LiveLearningSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const lastSpokenRef = useRef<string | null>(null)
  const { speakNow, stopSpeech, speechStatus } = useSpeech()
  const {
    phase,
    transcript,
    startListening,
    stopListening,
    reset,
  } = useVoiceRecognition()
  const isListening = phase === 'listening'
  const isSpeaking = speechStatus === 'speaking'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await learningSessionApi.get(sessionId)
        if (!cancelled) {
          setSession(response.data)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'live_session' })
        const resolved = resolveDisplayedError(
          error,
          { component: 'LiveLearningSessionPage', action: 'load' },
          'Failed to load session',
        )
        if (resolved !== null) {
          setErrorMessage(resolved)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
      stopSpeech()
    }
  }, [sessionId, stopSpeech])

  useEffect(() => {
    if (session == null) {
      return
    }
    const spoken =
      session.current_visual?.explanation_text ?? session.latest_tutor_message ?? ''
    if (spoken === '' || spoken === lastSpokenRef.current) {
      return
    }
    lastSpokenRef.current = spoken
    void speakNow(spoken, { languageStyle: session.params_snapshot.language_style })
  }, [session, speakNow])

  useEffect(() => {
    if (session == null) {
      return
    }
    const taughtCount = session.taught_toc_item_ids.length
    if (taughtCount === 0) {
      return
    }
    void import('../../services/topicProgress').then(({ updateTopicProgress }) => {
      updateTopicProgress(session.topic_id, taughtCount)
    })
  }, [session])

  useEffect(() => {
    if (transcript.trim() === '') {
      return
    }
    setMessage(transcript)
  }, [transcript])

  const boardElements = useMemo(() => {
    const slides = session?.current_visual?.slides ?? []
    if (slides.length === 0) {
      return []
    }
    return slides[0].elements.map((element) => ({
      element_id: element.element_id,
      type: element.type,
      content: element.content,
    }))
  }, [session])

  const submitMessage = async (text: string, channel: 'chat' | 'speech') => {
    const trimmed = text.trim()
    if (trimmed === '' || session == null || session.status !== 'active') {
      return
    }
    setSubmitting(true)
    setErrorMessage(null)
    stopSpeech()
    try {
      const response = await learningSessionApi.submitTurn(session.id, {
        message: trimmed,
        channel,
      })
      setSession(response.data)
      setMessage('')
      reset()
    } catch (error) {
      captureException(error, { page: 'live_session', action: 'submit' })
      const resolved = resolveDisplayedError(
        error,
        { component: 'LiveLearningSessionPage', action: 'submit_turn' },
        'Failed to send message',
      )
      if (resolved !== null) {
        setErrorMessage(resolved)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (session == null) {
    return (
      <AppPage>
        <PageSection label="Loading session">{errorMessage ?? 'Loading session…'}</PageSection>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <PageSection label={`${LEARNING_MODE_LABELS[session.mode]} session`}>
        <div className="live-session-header">
          <div>
            <p className="page-kicker">{LEARNING_MODE_LABELS[session.mode]}</p>
            <h1>Live session</h1>
            <p>
              Goal: {session.goal_status} · Status: {session.status}
              {isSpeaking ? ' · Tutor speaking…' : ''}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => navigate('/student')}>
            Exit
          </Button>
        </div>
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        <div className="live-session-layout">
          <SessionTutorStage
            speaking={isSpeaking}
            listening={isListening}
            statusLabel={
              isSpeaking
                ? 'Nova is speaking'
                : isListening
                  ? 'Nova is listening'
                  : submitting
                    ? 'Nova is thinking'
                    : 'Nova is ready'
            }
          />
          <div className="live-session-main">
            <LearningWhiteboard
              elements={boardElements}
              slideKey={session.current_visual?.id ?? 'empty'}
            />
            <p className="tutor-message">
              {session.current_visual?.explanation_text ?? session.latest_tutor_message}
            </p>
            <div className="session-composer">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type a question or response…"
                disabled={session.status !== 'active' || submitting}
              />
              <div className="session-composer-actions">
                <Button
                  type="button"
                  disabled={submitting || session.status !== 'active'}
                  onClick={() => void submitMessage(message, 'chat')}
                >
                  Send
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting || session.status !== 'active'}
                  onClick={() => {
                    if (isListening) {
                      stopListening()
                      void submitMessage(transcript || message, 'speech')
                    } else {
                      reset()
                      startListening()
                    }
                  }}
                >
                  {isListening ? 'Stop & send voice' : 'Speak'}
                </Button>
              </div>
            </div>
            {session.goal_status === 'completed' ? (
              <PageAlert>
                <p>Mode goal completed. You can exit anytime.</p>
              </PageAlert>
            ) : null}
          </div>
        </div>
      </PageSection>
    </AppPage>
  )
}
