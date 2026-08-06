import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Sparkles } from 'lucide-react'
import { TeachingLayout, LessonRhythmBar } from './ImmersiveClassroom'
import PopQuizPanel from '../quiz/PopQuizPanel'
import SageDoubtPanel from '../sage/SageDoubtPanel'
import CelebrationMoment from '../delight/CelebrationMoment'
import ErrorState from '../ui/ErrorState'
import Icon from '../ui/Icon'
import SlideRenderer from '../slides/SlideRenderer'
import { pickRandom, SLIDE_MILESTONES, LESSON_COMPLETE_LINES } from '../../constants/delightCopy'
import { XP_REWARDS } from '../../constants/xp'
import { useTeachingSession } from '../../hooks/useTeachingSession'
import { useMentor } from '../../context/MentorContext'
import { classroomModeToExpression } from '../../lib/mentors'
import { getMentorById } from '../../lib/mentors'
import { useMentorVoice } from '../../hooks/useMentorVoice'
import type { ClassroomAvatarMode } from '../../types/mentor.types'
import type { CurrentStateResponse } from '../../types/api.types'

interface CelebrationState {
  title: string
  subtitle?: string
  xp?: number
}

interface ClassroomLayoutProps {
  currentState: CurrentStateResponse
  sessionStep: number
  onAdvance: () => Promise<void>
  onSubmitPrediction: (predictionText: string) => Promise<void>
  onQuizSubmit: (questionId: string, selectedOptionId: string) => Promise<import('../../types/api.types').QuizAttemptResponse>
  onOpenSage: () => Promise<string>
  onAskSage: (doubtSessionId: string, message: string) => Promise<import('../../types/api.types').DoubtMessageResponse>
  onCloseSage: (doubtSessionId: string) => Promise<void>
  onSkipDoubts: () => Promise<void>
  onSlideView?: () => void
  onPrediction?: () => void
  onQuizResult?: (correct: boolean) => void
  onSageQuestion?: () => void
}

export default function ClassroomLayout({
  currentState,
  onAdvance,
  onSubmitPrediction,
  onQuizSubmit,
  onOpenSage,
  onAskSage,
  onCloseSage,
  onSkipDoubts,
  onSlideView,
  onPrediction,
  onQuizResult,
  onSageQuestion,
}: ClassroomLayoutProps) {
  const { mentor, expression, setExpression, pulseExpression, reactToQuiz } = useMentor()
  const activeMentor = mentor ?? getMentorById('sage')
  const [predictionText, setPredictionText] = useState('')
  const [showSagePanel, setShowSagePanel] = useState(false)
  const [doubtSessionId, setDoubtSessionId] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [syncedSubtitle, setSyncedSubtitle] = useState({ current: '', previous: '' })
  const lastMilestoneRef = useRef(0)

  const { speechStatus, speechError, speakAsMentor: speakMentorLine, speakLessonContent, stopPreview, warmUp, isSupported } = useMentorVoice()

  const slides = currentState.content?.slides ?? []
  const currentSlide = slides[currentSlideIndex]
  const stateType = currentState.current_state?.state_type
  const slideElements = useMemo(() => currentSlide?.elements ?? [], [currentSlide?.elements])
  const explanationText = currentSlide?.explanation?.explanation_text ?? ''
  const stateLabel = currentState.current_state?.label ?? 'Lesson'

  const isLiveLesson =
    stateType !== 'pop_quiz'
    && stateType !== 'student_predict'
    && stateType !== 'doubts_resolution'

  const session = useTeachingSession(explanationText, slideElements)

  const sessionRef = useRef(session)
  sessionRef.current = session

  const playLesson = useCallback(async (text: string) => {
    if (text.trim() === '') {
      return
    }
    sessionRef.current.resetSession()
    setSyncedSubtitle({ current: '', previous: '' })
    await speakLessonContent(activeMentor, text, {
      onSegmentStart: (event) => {
        setSyncedSubtitle((prev) => ({
          previous: prev.current,
          current: event.text,
        }))
        if (event.cueIndex !== null) {
          sessionRef.current.onCueStart(event.cueIndex)
        } else {
          sessionRef.current.setIsPlaying(true)
        }
      },
      onEnd: () => sessionRef.current.onPlaybackEnd(),
      onCancel: () => setSyncedSubtitle({ current: '', previous: '' }),
    })
  }, [activeMentor, speakLessonContent])

  const playLessonRef = useRef(playLesson)
  playLessonRef.current = playLesson

  const speakAsMentor = async (text: string) => {
    await speakMentorLine(activeMentor, text)
  }

  useEffect(() => {
    setCurrentSlideIndex(0)
    lastMilestoneRef.current = 0
    session.resetSession()
  }, [currentState.current_state?.state_id, session.resetSession])

  useEffect(() => {
    session.resetSession()
    setSyncedSubtitle({ current: '', previous: '' })
  }, [currentSlideIndex, explanationText, session.resetSession])

  useEffect(() => {
    if (!speechEnabled || !isLiveLesson || explanationText.trim() === '') {
      return
    }
    void playLessonRef.current(explanationText)
  }, [
    currentSlideIndex,
    currentState.current_state?.state_id,
    speechEnabled,
    isLiveLesson,
    explanationText,
  ])

  useEffect(() => {
    if (!isLiveLesson || slides.length === 0) {
      return
    }
    const percent = Math.round(((currentSlideIndex + 1) / slides.length) * 100)
    const milestone = SLIDE_MILESTONES[percent]
    if (milestone !== undefined && percent > lastMilestoneRef.current) {
      lastMilestoneRef.current = percent
      if (percent === 100) {
        setCelebration({
          title: pickRandom(LESSON_COMPLETE_LINES),
          subtitle: milestone,
          xp: XP_REWARDS.SLIDE,
        })
      }
    }
  }, [currentSlideIndex, isLiveLesson, slides.length])

  const handleEnableSpeech = async () => {
    warmUp()
    if (speechEnabled) {
      return
    }
    setSpeechEnabled(true)
    if (explanationText.trim() === '') {
      await speakAsMentor('Voice is on. Tap begin when you are ready.')
    }
  }

  const handleStartWithoutAudio = () => {
    if (session.cues.length > 0) {
      session.onCueStart(0)
    } else {
      session.onPlaybackEnd()
    }
  }

  const handleReplay = () => {
    stopPreview()
    setSyncedSubtitle({ current: '', previous: '' })
    if (speechEnabled && explanationText.trim() !== '') {
      void playLesson(explanationText)
      return
    }
    session.resetSession()
    if (session.cues.length > 0) {
      session.onCueStart(0)
    }
  }

  const handleContinue = async () => {
    if (advancing) {
      return
    }

    if (isLiveLesson && !speechEnabled && !session.hasStarted && session.cues.length > 0) {
      handleStartWithoutAudio()
      return
    }

    if (isLiveLesson && !speechEnabled && session.hasStarted && !session.playbackComplete) {
      session.advanceCueManually()
      return
    }

    setAdvancing(true)
    try {
      stopPreview()

      if (stateType === 'student_predict') {
        await onSubmitPrediction(predictionText)
        onPrediction?.()
        setPredictionText('')
        return
      }

      if (currentSlideIndex + 1 < slides.length) {
        setCurrentSlideIndex(currentSlideIndex + 1)
        onSlideView?.()
        return
      }

      await onAdvance()
    } finally {
      setAdvancing(false)
    }
  }

  const openSage = async () => {
    warmUp()
    setSpeechEnabled(true)
    const sessionId = await onOpenSage()
    setDoubtSessionId(sessionId)
    setShowSagePanel(true)
  }

  const resolvedAvatarMode: ClassroomAvatarMode =
    stateType === 'pop_quiz'
      ? 'questioning'
      : stateType === 'student_predict' || showSagePanel
        ? 'listening'
        : speechStatus === 'speaking'
          ? 'speaking'
          : 'idle'

  useEffect(() => {
    if (speechStatus === 'speaking') {
      setExpression(activeMentor.expression.onSpeak)
      return
    }

    const modeExpression = classroomModeToExpression(resolvedAvatarMode)
    if (modeExpression === 'listening') {
      setExpression(activeMentor.expression.onListen)
    } else if (modeExpression === 'curious') {
      setExpression('curious')
    } else if (modeExpression === 'speaking' || modeExpression === 'explaining') {
      setExpression(activeMentor.expression.onSpeak)
    } else {
      setExpression(activeMentor.expression.onIdle)
    }
  }, [resolvedAvatarMode, speechStatus, activeMentor, setExpression])

  useEffect(() => {
    if (celebration !== null) {
      pulseExpression('celebrating')
    }
  }, [celebration, pulseExpression])

  const showContinue =
    stateType !== 'pop_quiz'
    && stateType !== 'doubts_resolution'
    && !(stateType === 'student_predict' && predictionText.trim() === '')

  const continueLabel = (() => {
    if (advancing) {
      return 'Continuing…'
    }
    if (isLiveLesson && !speechEnabled && !session.hasStarted && session.cues.length > 0) {
      return 'Begin lesson'
    }
    if (isLiveLesson && !speechEnabled && session.hasStarted && !session.playbackComplete) {
      return 'Next'
    }
    return 'Continue'
  })()

  const isSpeaking = speechStatus === 'speaking'
  const subtitleCurrent = isSpeaking && syncedSubtitle.current !== ''
    ? syncedSubtitle.current
    : session.currentCue
  const subtitlePrevious = isSpeaking && syncedSubtitle.current !== ''
    ? syncedSubtitle.previous
    : session.previousCue
  const mentorTheme = {
    '--mentor-accent': activeMentor.visual.accent,
    '--mentor-glow': activeMentor.visual.glow,
  } as CSSProperties

  if (isLiveLesson) {
    return (
      <div className="immersive-classroom" style={mentorTheme}>
        <LessonRhythmBar
          lessonTitle={stateLabel}
          slideCurrent={currentSlideIndex + 1}
          slideTotal={Math.max(slides.length, 1)}
          sessionProgress={session.sessionProgress}
        />

        <CelebrationMoment
          show={celebration !== null}
          title={celebration?.title ?? ''}
          subtitle={celebration?.subtitle}
          xp={celebration?.xp}
          onDismiss={() => setCelebration(null)}
        />

        {speechError !== null ? <ErrorState message={speechError} /> : null}

        <TeachingLayout
          mentor={activeMentor}
          expression={expression}
          slideElements={slideElements}
          slideKey={`${currentState.current_state?.state_id ?? 'state'}-${currentSlideIndex}`}
          currentCue={subtitleCurrent}
          previousCue={subtitlePrevious}
          keywords={session.activeBeat?.keywords ?? []}
          cueIndex={session.activeCueIndex}
          totalCues={session.cues.length}
          isSpeaking={isSpeaking}
          hasStarted={session.hasStarted}
          beat={session.activeBeat}
          speechEnabled={speechEnabled}
          speechSupported={isSupported}
          onToggleSpeech={() => { void handleEnableSpeech() }}
          onReplay={handleReplay}
          canReplay={explanationText.trim() !== ''}
          continueLabel={continueLabel}
          continueDisabled={advancing || (isSpeaking && speechEnabled)}
          continueLoading={advancing}
          onContinue={() => { void handleContinue() }}
          showContinue={showContinue}
        />

        {showSagePanel && doubtSessionId !== null ? (
          <SageDoubtPanel
            lessonContext={stateLabel}
            onAsk={(message) => onAskSage(doubtSessionId, message)}
            onClose={async () => {
              await onCloseSage(doubtSessionId)
              setShowSagePanel(false)
              setDoubtSessionId(null)
            }}
            onQuestionAsked={onSageQuestion}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="classroom-shell">
      <CelebrationMoment
        show={celebration !== null}
        title={celebration?.title ?? ''}
        subtitle={celebration?.subtitle}
        xp={celebration?.xp}
        onDismiss={() => setCelebration(null)}
      />

      {speechError !== null ? <ErrorState message={speechError} /> : null}

      <div className="classroom-layout classroom-layout-classic">
        <section className="slide-area card">
          <div className="slide-content">
            {stateType === 'pop_quiz' ? (
              <PopQuizPanel
                questions={currentState.content?.quiz_questions ?? []}
                onSubmit={onQuizSubmit}
                onComplete={onAdvance}
                onQuizResult={(correct) => {
                  const reaction = reactToQuiz(correct)
                  if (reaction.line !== '') {
                    void speakAsMentor(reaction.line)
                  }
                  onQuizResult?.(correct)
                }}
              />
            ) : stateType === 'student_predict' ? (
              <div className="predict-panel">
                <SlideRenderer elements={slideElements} />
                <label className="form-field">
                  <span className="field-label">Your prediction</span>
                  <textarea
                    className="textarea"
                    placeholder="What do you think happens next?"
                    value={predictionText}
                    onChange={(event) => setPredictionText(event.target.value)}
                  />
                  <p className="field-hint">There’s no wrong answer here — reasoning is the win. +{XP_REWARDS.PREDICTION} XP when you continue.</p>
                </label>
              </div>
            ) : (
              <SlideRenderer elements={slideElements} />
            )}
          </div>

          <div className="classroom-controls classroom-controls-desktop">
            {stateType === 'doubts_resolution' ? (
              <div className="sage-launch">
                <div className="sage-launch-identity" aria-hidden="true">
                  <Icon icon={Sparkles} size={20} className="sage-launch-icon" />
                </div>
                <div className="sage-launch-copy">
                  <p className="sage-launch-kicker">AI tutor</p>
                  <strong>Ask SAGE anything</strong>
                  <p>Stuck? SAGE explains without judgment — +{XP_REWARDS.SAGE_ASK} XP per question.</p>
                </div>
                <div className="sage-launch-actions">
                  <button type="button" className="btn btn-sage btn-with-icon" onClick={() => { void openSage() }}>
                    <Icon icon={Sparkles} size={16} />
                    Open SAGE
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { void onSkipDoubts() }}>Skip for now</button>
                </div>
              </div>
            ) : null}
            {showContinue ? (
              <button
                type="button"
                className={`btn btn-primary btn-with-icon${advancing ? ' is-loading' : ''}`}
                onClick={() => { void handleContinue() }}
                disabled={advancing}
              >
                {continueLabel}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {showContinue ? (
        <div className="classroom-sticky-cta">
          <button
            type="button"
            className={`btn btn-primary btn-with-icon${advancing ? ' is-loading' : ''}`}
            onClick={() => { void handleContinue() }}
            disabled={advancing}
          >
            {continueLabel}
          </button>
        </div>
      ) : null}

      {showSagePanel && doubtSessionId !== null ? (
        <SageDoubtPanel
          lessonContext={stateLabel}
          onAsk={(message) => onAskSage(doubtSessionId, message)}
          onClose={async () => {
            await onCloseSage(doubtSessionId)
            setShowSagePanel(false)
            setDoubtSessionId(null)
          }}
          onQuestionAsked={onSageQuestion}
        />
      ) : null}
    </div>
  )
}
