import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LearningWhiteboard from '../../components/classroom/LearningWhiteboard'
import SessionTutorStage from '../../components/classroom/SessionTutorStage'
import { AppPage, Button, ErrorState, PageAlert, PageSection } from '../../components/ui'
import { useSpeech } from '../../hooks/useSpeech'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import type { LearningSessionResponse, SessionSlide } from '../../types/learning.types'
import { LEARNING_MODE_LABELS } from '../../types/learning.types'

function buildFallbackExplanation(slide: SessionSlide): string {
  const parts: string[] = []
  for (const element of slide.elements) {
    if (typeof element.content === 'string' && element.content.trim() !== '') {
      parts.push(element.content.trim())
      continue
    }
    if (Array.isArray(element.content)) {
      for (const item of element.content) {
        if (typeof item === 'string' && item.trim() !== '') {
          parts.push(item.trim())
        }
      }
    }
  }
  if (parts.length === 0) {
    return "Let's look at the next slide."
  }
  return parts.join('. ')
}

function resolveSlideExplanation(
  slides: SessionSlide[],
  slideIndex: number,
  visualExplanation: string | undefined,
): string {
  const slide = slides[slideIndex]
  if (slide == null) {
    return ''
  }
  const slideText = slide.explanation_text?.trim() ?? ''
  if (slideText !== '') {
    return slideText
  }
  const anySlideHasExplanation = slides.some(
    (item) => (item.explanation_text?.trim() ?? '') !== '',
  )
  if (!anySlideHasExplanation && slideIndex === 0) {
    const visualText = visualExplanation?.trim() ?? ''
    if (visualText !== '') {
      return visualText
    }
  }
  return buildFallbackExplanation(slide)
}

export default function LiveLearningSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const lastSpokenKeyRef = useRef<string | null>(null)
  const slideIndexRef = useRef(0)
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

  const slides = session?.current_visual?.slides ?? []
  const currentSlide = slides[slideIndex]
  const currentExplanation = resolveSlideExplanation(
    slides,
    slideIndex,
    session?.current_visual?.explanation_text,
  )
  const hasMoreSlides = slideIndex < slides.length - 1
  const visualId = session?.current_visual?.id ?? 'empty'

  useEffect(() => {
    slideIndexRef.current = slideIndex
  }, [slideIndex])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await learningSessionApi.get(sessionId)
        if (!cancelled) {
          setSession(response.data)
          setSlideIndex(0)
          setAwaitingContinue(false)
          lastSpokenKeyRef.current = null
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
    setSlideIndex(0)
    setAwaitingContinue(false)
    lastSpokenKeyRef.current = null
  }, [visualId])

  const advanceAfterSpeech = useCallback(() => {
    const currentIndex = slideIndexRef.current
    const slideCount = slides.length
    if (currentIndex < slideCount - 1) {
      setSlideIndex(currentIndex + 1)
      setAwaitingContinue(false)
      return
    }
    setAwaitingContinue(true)
  }, [slides.length])

  useEffect(() => {
    if (session == null || currentExplanation === '') {
      return
    }
    const spokenKey = `${visualId}:${slideIndex}:${currentExplanation}`
    if (spokenKey === lastSpokenKeyRef.current) {
      return
    }
    lastSpokenKeyRef.current = spokenKey
    setAwaitingContinue(false)
    void speakNow(currentExplanation, {
      languageStyle: session.params_snapshot.language_style,
      onEnd: () => {
        advanceAfterSpeech()
      },
    })
  }, [session, currentExplanation, slideIndex, visualId, speakNow, advanceAfterSpeech])

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
    if (currentSlide == null) {
      return []
    }
    return currentSlide.elements.map((element) => ({
      element_id: element.element_id,
      type: element.type,
      content: element.content,
    }))
  }, [currentSlide])

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
      setSlideIndex(0)
      setAwaitingContinue(false)
      lastSpokenKeyRef.current = null
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

  const continueLesson = () => {
    if (hasMoreSlides) {
      stopSpeech()
      lastSpokenKeyRef.current = null
      setSlideIndex((current) => current + 1)
      setAwaitingContinue(false)
      return
    }
    void submitMessage('Please continue to the next part.', 'chat')
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
              {slides.length > 0 ? ` · Slide ${slideIndex + 1} of ${slides.length}` : ''}
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
              slideKey={`${visualId}-${currentSlide?.slide_id ?? slideIndex}`}
            />
            <p className="tutor-message">
              {currentExplanation !== ''
                ? currentExplanation
                : session.latest_tutor_message}
            </p>
            {awaitingContinue && !isSpeaking ? (
              <div className="session-composer-actions">
                <Button
                  type="button"
                  disabled={submitting || session.status !== 'active'}
                  onClick={() => continueLesson()}
                >
                  {hasMoreSlides ? 'Next slide' : 'Continue teaching'}
                </Button>
              </div>
            ) : null}
            {!isSpeaking && !awaitingContinue && hasMoreSlides ? (
              <div className="session-composer-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting || session.status !== 'active'}
                  onClick={() => continueLesson()}
                >
                  Next slide
                </Button>
              </div>
            ) : null}
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
