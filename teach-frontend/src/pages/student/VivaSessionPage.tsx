import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SessionTutorStage from '../../components/classroom/SessionTutorStage'
import { AppPage, Button, ErrorState, PageAlert, PageSection } from '../../components/ui'
import { useSpeech } from '../../hooks/useSpeech'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import type { LearningSessionResponse, VivaAdvanceReason } from '../../types/learning.types'

const SILENCE_MS = 12_000

export default function VivaSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [micUnlocked, setMicUnlocked] = useState(false)
  const lastSpokenRef = useRef<string | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
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
        captureException(error, { page: 'viva_session' })
        const resolved = resolveDisplayedError(
          error,
          { component: 'VivaSessionPage', action: 'load' },
          'Failed to load viva',
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
      if (silenceTimerRef.current != null) {
        window.clearTimeout(silenceTimerRef.current)
      }
    }
  }, [sessionId, stopSpeech])

  useEffect(() => {
    if (session == null) {
      return
    }
    const spoken = session.latest_tutor_message ?? ''
    if (spoken === '' || spoken === lastSpokenRef.current) {
      return
    }
    lastSpokenRef.current = spoken
    setMicUnlocked(false)
    stopListening()
    void speakNow(spoken, {
      languageStyle: session.params_snapshot.language_style,
      onEnd: () => setMicUnlocked(true),
    }).then((started) => {
      if (started !== true) {
        setMicUnlocked(true)
      }
    })
  }, [session, speakNow, stopListening])

  useEffect(() => {
    if (silenceTimerRef.current != null) {
      window.clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (
      session == null ||
      session.status !== 'active' ||
      !micUnlocked ||
      isSpeaking ||
      isListening ||
      submitting
    ) {
      return
    }
    silenceTimerRef.current = window.setTimeout(() => {
      void advance('silence')
    }, SILENCE_MS)
    return () => {
      if (silenceTimerRef.current != null) {
        window.clearTimeout(silenceTimerRef.current)
      }
    }
  }, [session, micUnlocked, isSpeaking, isListening, submitting, message])

  useEffect(() => {
    if (transcript.trim() === '') {
      return
    }
    setMessage(transcript)
  }, [transcript])

  const advance = async (reason: VivaAdvanceReason) => {
    if (session == null || session.status !== 'active' || submitting) {
      return
    }
    setSubmitting(true)
    stopSpeech()
    stopListening()
    try {
      const response = await learningSessionApi.advanceViva(session.id, reason)
      setSession(response.data)
      setMessage('')
      reset()
    } catch (error) {
      captureException(error, { page: 'viva_session', action: 'advance' })
      const resolved = resolveDisplayedError(
        error,
        { component: 'VivaSessionPage', action: 'advance' },
        'Failed to advance viva',
      )
      if (resolved !== null) {
        setErrorMessage(resolved)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const submitAnswer = async (channel: 'chat' | 'speech') => {
    const trimmed = message.trim()
    if (trimmed === '' || session == null || session.status !== 'active' || !micUnlocked) {
      return
    }
    setSubmitting(true)
    stopSpeech()
    stopListening()
    try {
      const response = await learningSessionApi.submitTurn(session.id, {
        message: trimmed,
        channel,
      })
      setSession(response.data)
      setMessage('')
      reset()
    } catch (error) {
      captureException(error, { page: 'viva_session', action: 'submit' })
      const resolved = resolveDisplayedError(
        error,
        { component: 'VivaSessionPage', action: 'submit' },
        'Failed to submit answer',
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
        <PageSection label="Loading viva">{errorMessage ?? 'Loading viva…'}</PageSection>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <PageSection label="Viva session">
        <div className="live-session-header">
          <div>
            <p className="page-kicker">Know your understanding</p>
            <h1>Viva</h1>
            <p>
              Turn-by-turn oral check. Wait for the tutor to finish before answering.
              {isSpeaking ? ' Tutor speaking…' : micUnlocked ? ' Your turn.' : ''}
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
            listening={isListening || (micUnlocked && !isSpeaking && !submitting)}
            statusLabel={
              isSpeaking
                ? 'Nova is speaking — wait for your turn'
                : submitting
                  ? 'Nova is evaluating'
                  : micUnlocked
                    ? 'Your turn to answer'
                    : 'Nova is ready'
            }
          />
          <div className="live-session-main">
            <div className="viva-transcript">
              {session.turns.map((turn) => (
                <div key={turn.id} className={`viva-turn viva-turn-${turn.role}`}>
                  <strong>{turn.role}</strong>
                  <p>{turn.text}</p>
                </div>
              ))}
            </div>
            {session.viva_assessment != null && session.goal_status === 'completed' ? (
              <PageAlert>
                <strong>Insights</strong>
                <p>{session.viva_assessment.insight_summary}</p>
                {session.viva_assessment.weak_toc_item_ids.length > 0 ? (
                  <p>Weaker TOC ids: {session.viva_assessment.weak_toc_item_ids.join(', ')}</p>
                ) : null}
              </PageAlert>
            ) : null}
            <div className="session-composer">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={micUnlocked ? 'Answer here…' : 'Wait for the tutor to finish…'}
                disabled={!micUnlocked || submitting || session.status !== 'active' || isSpeaking}
              />
              <div className="session-composer-actions">
                <Button
                  type="button"
                  disabled={!micUnlocked || submitting || session.status !== 'active' || isSpeaking}
                  onClick={() => void submitAnswer('chat')}
                >
                  Submit answer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!micUnlocked || submitting || session.status !== 'active' || isSpeaking}
                  onClick={() => {
                    if (isListening) {
                      stopListening()
                      void submitAnswer('speech')
                    } else {
                      reset()
                      startListening()
                    }
                  }}
                >
                  {isListening ? 'Stop & send' : 'Speak answer'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!micUnlocked || submitting || session.status !== 'active' || isSpeaking}
                  onClick={() => void advance('pass')}
                >
                  Pass
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!micUnlocked || submitting || session.status !== 'active' || isSpeaking}
                  onClick={() => void advance('dont_know')}
                >
                  I don&apos;t know
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </AppPage>
  )
}
