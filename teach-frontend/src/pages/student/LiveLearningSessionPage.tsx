import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LearningWhiteboard from '../../components/classroom/LearningWhiteboard'
import SessionPreparingView from '../../components/classroom/SessionPreparingView'
import SessionTutorStage from '../../components/classroom/SessionTutorStage'
import { AppPage, Button, ErrorState, PageAlert, PageSection } from '../../components/ui'
import { useLiveSessionTutorSpeech } from '../../hooks/useLiveSessionTutorSpeech'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { captureException } from '../../lib/monitoring'
import {
  FIRST_TURN_POLL_INTERVAL_MS,
  getFirstTurnError,
  isFirstTurnFailed,
  isFirstTurnPreparing,
} from '../../lib/sessionFirstTurn'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import type { LearningSessionResponse, SessionSlide, SessionTurn } from '../../types/learning.types'
import { LEARNING_MODE_LABELS } from '../../types/learning.types'

const SESSION_ENTER_MS = 520

function extractSlideHeading(slide: SessionSlide | undefined): string {
  if (slide == null) {
    return ''
  }
  for (const element of slide.elements) {
    if (element.type === 'heading' && typeof element.content === 'string') {
      return element.content.trim()
    }
  }
  return ''
}

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

function latestSpokenLine(revealedText: string): string {
  const trimmed = revealedText.trim()
  if (trimmed === '') {
    return ''
  }
  const sentences = trimmed.split(/(?<=[.!?…])\s+/).map((part) => part.trim()).filter((part) => part !== '')
  if (sentences.length === 0) {
    return trimmed
  }
  return sentences[sentences.length - 1]
}

function turnsForDisplay(turns: SessionTurn[], hideLatestTutorWhileSpeaking: boolean): SessionTurn[] {
  const sorted = [...turns].sort((left, right) => left.order - right.order)
  if (!hideLatestTutorWhileSpeaking) {
    return sorted
  }
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (sorted[index]?.role === 'tutor') {
      return sorted.filter((_, turnIndex) => turnIndex !== index)
    }
  }
  return sorted
}

export default function LiveLearningSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [retryingFirstTurn, setRetryingFirstTurn] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [preparingExiting, setPreparingExiting] = useState(false)
  const [sessionEntering, setSessionEntering] = useState(false)
  const lastSpokenKeyRef = useRef<string | null>(null)
  const slideIndexRef = useRef(0)
  const wasPreparingRef = useRef(false)
  const {
    revealedText,
    speechStatus,
    isPaused,
    isSpeechActive,
    speakTutorText,
    interruptSpeech,
    resetSpeechTracking,
    togglePauseSpeech,
  } = useLiveSessionTutorSpeech()
  const {
    phase,
    transcript,
    startListening,
    stopListening,
    reset,
  } = useVoiceRecognition()
  const isListening = phase === 'listening'
  const isNovaSpeaking = speechStatus === 'speaking' || speechStatus === 'paused'
  const canInteractWithSession =
    session?.status === 'active'
    || (
      session?.status === 'completed'
      && (session.mode === 'teach' || session.mode === 'doubt')
    )

  const preparingFirstTurn = session != null && isFirstTurnPreparing(session)
  const firstTurnFailed = session != null && isFirstTurnFailed(session)

  const slides = session?.current_visual?.slides ?? []
  const currentSlide = slides[slideIndex]
  const currentExplanation = resolveSlideExplanation(
    slides,
    slideIndex,
    session?.current_visual?.explanation_text,
  )
  const hasMoreSlides = slideIndex < slides.length - 1
  const visualId = session?.current_visual?.id ?? 'empty'
  const spokenCaption = latestSpokenLine(revealedText)
  const tutorSubtitle =
    spokenCaption !== ''
      ? spokenCaption
      : extractSlideHeading(currentSlide) !== ''
        ? extractSlideHeading(currentSlide)
        : session?.latest_tutor_message?.trim() ?? ''

  const visibleTurns = useMemo(
    () => turnsForDisplay(session?.turns ?? [], speechStatus === 'speaking' || speechStatus === 'paused'),
    [session?.turns, speechStatus],
  )

  useEffect(() => {
    slideIndexRef.current = slideIndex
  }, [slideIndex])

  const applySession = useCallback((nextSession: LearningSessionResponse) => {
    setSession((current) => {
      const isFreshLoad = current == null
      if (isFreshLoad || current.current_visual?.id !== nextSession.current_visual?.id) {
        setSlideIndex(0)
        setAwaitingContinue(false)
        lastSpokenKeyRef.current = null
      }
      return nextSession
    })
  }, [])

  useEffect(() => {
    if (preparingFirstTurn) {
      wasPreparingRef.current = true
      return undefined
    }
    if (wasPreparingRef.current && session != null && !firstTurnFailed) {
      setPreparingExiting(true)
      setSessionEntering(true)
      wasPreparingRef.current = false
      const timer = window.setTimeout(() => {
        setPreparingExiting(false)
        setSessionEntering(false)
      }, SESSION_ENTER_MS)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [preparingFirstTurn, session, firstTurnFailed])

  const showPreparingOverlay =
    initialLoading || preparingFirstTurn || firstTurnFailed || preparingExiting
  const showActiveSession =
    session != null && !firstTurnFailed && (!preparingFirstTurn || preparingExiting)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setInitialLoading(true)
      setErrorMessage(null)
      try {
        const response = await learningSessionApi.get(sessionId)
        if (!cancelled) {
          applySession(response.data)
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
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
      resetSpeechTracking()
    }
  }, [sessionId, resetSpeechTracking, applySession])

  useEffect(() => {
    if (session == null || !preparingFirstTurn || firstTurnFailed) {
      return undefined
    }

    let cancelled = false
    const poll = async () => {
      try {
        const response = await learningSessionApi.get(sessionId, { poll: true })
        if (!cancelled) {
          applySession(response.data)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'live_session', action: 'poll_first_turn' })
      }
    }

    const timer = window.setInterval(() => {
      void poll()
    }, FIRST_TURN_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [session, preparingFirstTurn, firstTurnFailed, sessionId, applySession])

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
    if (session == null || preparingFirstTurn || currentExplanation === '') {
      return
    }
    const spokenKey = `${visualId}:${slideIndex}:${currentExplanation}`
    if (spokenKey === lastSpokenKeyRef.current) {
      return
    }
    lastSpokenKeyRef.current = spokenKey
    setAwaitingContinue(false)
    void speakTutorText(
      currentExplanation,
      session.params_snapshot.language_style,
      () => {
        advanceAfterSpeech()
      },
    )
  }, [session, preparingFirstTurn, currentExplanation, slideIndex, visualId, speakTutorText, advanceAfterSpeech])

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
    if (
      trimmed === ''
      || session == null
      || !canInteractWithSession
      || submitting
      || preparingFirstTurn
    ) {
      return
    }
    interruptSpeech()
    if (isListening) {
      stopListening()
    }
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const response = await learningSessionApi.submitTurn(session.id, {
        message: trimmed,
        channel,
      })
      applySession(response.data)
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

  const retryFirstTurn = async () => {
    if (session == null) {
      return
    }
    setRetryingFirstTurn(true)
    setErrorMessage(null)
    try {
      const response = await learningSessionApi.retryFirstTurn(session.id)
      applySession(response.data)
    } catch (error) {
      captureException(error, { page: 'live_session', action: 'retry_first_turn' })
      const resolved = resolveDisplayedError(
        error,
        { component: 'LiveLearningSessionPage', action: 'retry_first_turn' },
        'Could not retry lesson preparation',
      )
      if (resolved !== null) {
        setErrorMessage(resolved)
      }
    } finally {
      setRetryingFirstTurn(false)
    }
  }

  const continueLesson = () => {
    if (hasMoreSlides) {
      interruptSpeech()
      lastSpokenKeyRef.current = null
      setSlideIndex((current) => current + 1)
      setAwaitingContinue(false)
      return
    }
    void submitMessage('Please continue to the next part.', 'chat')
  }

  const handleSpeakClick = () => {
    if (!canInteractWithSession || submitting || preparingFirstTurn) {
      return
    }
    if (isListening) {
      void submitMessage(transcript || message, 'speech')
      return
    }
    interruptSpeech()
    reset()
    startListening()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }
    event.preventDefault()
    void submitMessage(message, 'chat')
  }

  if (session == null && !initialLoading) {
    return (
      <AppPage>
        <PageSection label="Session unavailable">
          <ErrorState
            message={errorMessage ?? 'Failed to load session'}
            onDismiss={() => navigate('/student')}
          />
        </PageSection>
      </AppPage>
    )
  }

  const canSendMessage = canInteractWithSession && message.trim() !== '' && !submitting
  const showTutorPauseControl = canInteractWithSession && isSpeechActive

  return (
    <AppPage>
      <PageSection label={session != null ? `${LEARNING_MODE_LABELS[session.mode]} session` : 'Opening session'}>
        {showActiveSession && session != null ? (
          <div className={`live-session-active${sessionEntering ? ' is-entering' : ''}`}>
            <div className="live-session-header">
              <div>
                <p className="page-kicker">{LEARNING_MODE_LABELS[session.mode]}</p>
                <h1>Live session</h1>
                <p>
                  Goal: {session.goal_status} · Status: {session.status}
                  {slides.length > 0 ? ` · Slide ${slideIndex + 1} of ${slides.length}` : ''}
                  {isSpeechActive ? ' · Type or speak anytime to interrupt Nova' : ''}
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
            <div className="live-session-layout live-session-layout--tutor-right">
              <div className="live-session-main">
                <LearningWhiteboard
                  elements={boardElements}
                  slideKey={`${visualId}-${currentSlide?.slide_id ?? slideIndex}`}
                  variant="marker"
                />
                {visibleTurns.length > 0 ? (
                  <div className="session-conversation" aria-label="Conversation">
                    {visibleTurns.map((turn) => (
                      <div
                        key={turn.id}
                        className={`session-conversation-turn session-conversation-turn--${turn.role}`}
                      >
                        <span className="session-conversation-role">
                          {turn.role === 'tutor' ? 'Nova' : 'You'}
                        </span>
                        <p>{turn.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {awaitingContinue && !isSpeechActive ? (
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
                {!isSpeechActive && !awaitingContinue && hasMoreSlides ? (
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
                <div className="session-composer session-composer-interactive">
                  {isSpeechActive ? (
                    <p className="session-composer-hint">
                      Nova is talking — you can still type or tap Speak. Sending a message stops Nova and gets an answer.
                    </p>
                  ) : null}
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Type a question anytime — Enter to send, Shift+Enter for a new line…"
                    disabled={!canInteractWithSession}
                    aria-disabled={!canInteractWithSession}
                  />
                  <div className="session-composer-actions">
                    <Button
                      type="button"
                      loading={submitting}
                      disabled={!canSendMessage}
                      onClick={() => void submitMessage(message, 'chat')}
                    >
                      Send
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canInteractWithSession}
                      onClick={handleSpeakClick}
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
              <SessionTutorStage
                speaking={isNovaSpeaking}
                listening={isListening}
                submitting={submitting || speechStatus === 'loading'}
                liveCaption=""
                mode={session.mode}
                subtitle={tutorSubtitle}
                showPauseControl={showTutorPauseControl}
                isPaused={isPaused}
                onTogglePause={togglePauseSpeech}
              />
            </div>
          </div>
        ) : null}

        {showPreparingOverlay ? (
          <div className={`session-preparing-overlay${preparingExiting ? ' is-exiting' : ''}`}>
            <SessionPreparingView
              mode={session?.mode ?? 'teach'}
              failed={firstTurnFailed}
              errorMessage={session != null ? getFirstTurnError(session) ?? errorMessage : errorMessage}
              retrying={retryingFirstTurn}
              exiting={preparingExiting}
              onRetry={() => void retryFirstTurn()}
            />
          </div>
        ) : null}
      </PageSection>
    </AppPage>
  )
}
