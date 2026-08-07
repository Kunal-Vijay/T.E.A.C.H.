import { useEffect, useMemo, useState, type KeyboardEvent, type RefObject } from 'react'
import { ErrorState, PageAlert } from '../ui'
import { topicApi } from '../../services/api/topicApi'
import type { LearningSessionResponse, SessionSlide, SessionTurn, TopicResponse } from '../../types/learning.types'
import { LEARNING_MODE_LABELS } from '../../types/learning.types'
import LiveClassroomAvatarCard from './LiveClassroomAvatarCard'
import LiveClassroomBoardPane from './LiveClassroomBoardPane'
import LiveClassroomComposer from './LiveClassroomComposer'
import LiveClassroomConversation from './LiveClassroomConversation'
import LiveClassroomHeader from './LiveClassroomHeader'

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

export interface LiveClassroomViewProps {
  workspaceRef: RefObject<HTMLDivElement | null>
  session: LearningSessionResponse
  sessionEntering: boolean
  errorMessage: string | null
  onDismissError: () => void
  boardElements: Array<Record<string, unknown>>
  slideKey: string
  slideIndex: number
  slidesCount: number
  currentSlide: SessionSlide | undefined
  visibleTurns: SessionTurn[]
  message: string
  onMessageChange: (value: string) => void
  submitting: boolean
  canInteractWithSession: boolean
  canSendMessage: boolean
  isListening: boolean
  isSpeechActive: boolean
  isNovaSpeaking: boolean
  isThinking: boolean
  isPaused: boolean
  showPauseControl: boolean
  onTogglePause: () => void
  tutorSubtitle: string
  awaitingContinue: boolean
  hasMoreSlides: boolean
  onContinueLesson: () => void
  onSubmitMessage: () => void
  onSpeakClick: () => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onExit: () => void
}

export default function LiveClassroomView({
  workspaceRef,
  session,
  sessionEntering,
  errorMessage,
  onDismissError,
  boardElements,
  slideKey,
  slideIndex,
  slidesCount,
  currentSlide,
  visibleTurns,
  message,
  onMessageChange,
  submitting,
  canInteractWithSession,
  canSendMessage,
  isListening,
  isSpeechActive,
  isNovaSpeaking,
  isThinking,
  isPaused,
  showPauseControl,
  onTogglePause,
  tutorSubtitle,
  awaitingContinue,
  hasMoreSlides,
  onContinueLesson,
  onSubmitMessage,
  onSpeakClick,
  onComposerKeyDown,
  isFullscreen,
  onToggleFullscreen,
  onExit,
}: LiveClassroomViewProps) {
  const [topic, setTopic] = useState<TopicResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    void topicApi.get(session.topic_id).then((response) => {
      if (!cancelled) {
        setTopic(response.data)
      }
    }).catch(() => {
      /* fall back to session metadata */
    })
    return () => {
      cancelled = true
    }
  }, [session.topic_id])

  const progressPercent = useMemo(() => {
    const tocCount = topic?.toc_items.length ?? 0
    if (tocCount > 0) {
      return Math.min(100, Math.round((session.taught_toc_item_ids.length / tocCount) * 100))
    }
    if (slidesCount > 0) {
      return Math.min(100, Math.round(((slideIndex + 1) / slidesCount) * 100))
    }
    return session.goal_status === 'completed' ? 100 : 8
  }, [topic, session.taught_toc_item_ids.length, session.goal_status, slideIndex, slidesCount])

  const currentTopic = useMemo(() => {
    const heading = extractSlideHeading(currentSlide)
    if (heading !== '') {
      return heading
    }
    const taughtId = session.taught_toc_item_ids[session.taught_toc_item_ids.length - 1]
    const tocItem = topic?.toc_items.find((item) => item.id === taughtId)
    return tocItem?.title ?? 'Getting started'
  }, [currentSlide, session.taught_toc_item_ids, topic?.toc_items])

  const lessonTitle = topic?.title ?? extractSlideHeading(currentSlide) ?? 'Live Lesson'
  const subject = topic?.subject ?? 'Lesson'
  const slideLabel = slidesCount > 0 ? `Slide ${slideIndex + 1} / ${slidesCount}` : 'Slide 1 / 1'
  const statusLabel = session.status === 'active' ? 'Active' : session.status === 'completed' ? 'Complete' : 'Session'

  const showContinue = awaitingContinue && !isSpeechActive
  const showNextSlide = !isSpeechActive && !awaitingContinue && hasMoreSlides
  const continueLabel = showContinue
    ? (hasMoreSlides ? 'Next slide' : 'Continue teaching')
    : 'Next slide'

  return (
    <div
      ref={workspaceRef as RefObject<HTMLDivElement>}
      className={`live-classroom${sessionEntering ? ' is-entering' : ''}${isFullscreen ? ' is-fullscreen' : ''}`}
    >
      <LiveClassroomHeader
        subject={subject}
        lessonTitle={lessonTitle}
        modeLabel={LEARNING_MODE_LABELS[session.mode]}
        statusLabel={statusLabel}
        slideLabel={slideLabel}
        progressPercent={progressPercent}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onExit={onExit}
      />

      {errorMessage !== null ? (
        <PageAlert className="live-classroom-alert">
          <ErrorState message={errorMessage} onDismiss={onDismissError} />
        </PageAlert>
      ) : null}

      <div className="live-classroom-grid">
        <LiveClassroomBoardPane
          elements={boardElements}
          slideKey={slideKey}
          currentTopic={currentTopic}
          slideLabel={slideLabel}
          showContinue={showContinue}
          showNextSlide={showNextSlide}
          continueLabel={continueLabel}
          canContinue={session.status === 'active'}
          onContinue={onContinueLesson}
        />

        <aside className="live-classroom-side">
          <LiveClassroomAvatarCard
            speaking={isNovaSpeaking}
            listening={isListening}
            thinking={isThinking}
            isPaused={isPaused}
            showPauseControl={showPauseControl}
            onTogglePause={onTogglePause}
            subtitle={tutorSubtitle}
          />
          <LiveClassroomConversation turns={visibleTurns} />
          <LiveClassroomComposer
            message={message}
            onChange={onMessageChange}
            onSend={onSubmitMessage}
            onSpeakClick={onSpeakClick}
            isListening={isListening}
            canSend={canSendMessage}
            canInteract={canInteractWithSession}
            submitting={submitting}
            onKeyDown={onComposerKeyDown}
          />
        </aside>
      </div>
    </div>
  )
}
