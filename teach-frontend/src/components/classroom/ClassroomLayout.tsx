import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Radio, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react'
import SlideRenderer from '../slides/SlideRenderer'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'
import PopQuizPanel from '../quiz/PopQuizPanel'
import SageDoubtPanel from '../sage/SageDoubtPanel'
import CelebrationMoment from '../delight/CelebrationMoment'
import LearningStatsBar from '../delight/LearningStatsBar'
import ErrorState from '../ui/ErrorState'
import Icon from '../ui/Icon'
import { pickRandom, SLIDE_MILESTONES, MOTIVATIONAL_KICKERS } from '../../constants/delightCopy'
import { XP_REWARDS } from '../../constants/xp'
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
  sessionStep,
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
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null)
  const pendingSpeakAfterAdvanceRef = useRef(false)
  const lastMilestoneRef = useRef(0)

  const { speechStatus, speechError, speakAsMentor: speakMentorLine, speakLessonContent, warmUp, isSupported } = useMentorVoice()

  const speakAsMentor = async (text: string, asLesson = true) => {
    if (asLesson) {
      await speakLessonContent(activeMentor, text)
      return
    }
    await speakMentorLine(activeMentor, text)
  }

  const slides = currentState.content?.slides ?? []
  const currentSlide = slides[currentSlideIndex]
  const stateType = currentState.current_state?.state_type
  const explanationText = currentSlide?.explanation?.explanation_text ?? ''
  const stateLabel = currentState.current_state?.label ?? 'Lesson'
  const motivationalKicker = useMemo(() => pickRandom(MOTIVATIONAL_KICKERS), [currentState.current_state?.state_id])

  const avatarCaption = useMemo(() => {
    if (explanationText.trim() !== '') {
      return explanationText
    }
    return stateLabel
  }, [explanationText, stateLabel])

  const slideProgress = useMemo(() => {
    if (stateType === 'pop_quiz' || stateType === 'doubts_resolution' || stateType === 'student_predict') {
      return null
    }
    if (slides.length === 0) {
      return null
    }
    return {
      current: currentSlideIndex + 1,
      total: slides.length,
      percent: Math.round(((currentSlideIndex + 1) / slides.length) * 100),
    }
  }, [currentSlideIndex, slides.length, stateType])

  useEffect(() => {
    setCurrentSlideIndex(0)
    lastMilestoneRef.current = 0
    setMilestoneMessage(null)
  }, [currentState.current_state?.state_id])

  useEffect(() => {
    if (!speechEnabled || !pendingSpeakAfterAdvanceRef.current) {
      return
    }
    pendingSpeakAfterAdvanceRef.current = false
    if (explanationText.trim() !== '') {
      speakAsMentor(explanationText)
    }
  }, [currentState.current_state?.state_id, explanationText, speechEnabled, speakLessonContent])

  useEffect(() => {
    if (slideProgress === null) {
      return
    }
    const milestone = SLIDE_MILESTONES[slideProgress.percent]
    if (milestone !== undefined && slideProgress.percent > lastMilestoneRef.current) {
      lastMilestoneRef.current = slideProgress.percent
      setMilestoneMessage(milestone)
      if (slideProgress.percent === 100) {
        setCelebration({
          title: 'Section complete',
          subtitle: milestone,
          xp: XP_REWARDS.SLIDE,
        })
      }
    }
  }, [slideProgress])

  const handleEnableSpeech = async () => {
    warmUp()
    setSpeechEnabled(true)
    if (explanationText.trim() !== '') {
      await speakAsMentor(explanationText)
      return
    }
    await speakAsMentor('Voice is enabled. Click Continue when you are ready.')
  }

  const speakSlideExplanation = async (slideIndex: number) => {
    if (!speechEnabled) {
      return
    }
    const slideExplanation = slides[slideIndex]?.explanation?.explanation_text ?? ''
    if (slideExplanation.trim() !== '') {
      await speakAsMentor(slideExplanation)
    }
  }

  const handleContinue = async () => {
    if (advancing) {
      return
    }
    setAdvancing(true)
    try {
      if (stateType === 'student_predict') {
        await onSubmitPrediction(predictionText)
        onPrediction?.()
        setPredictionText('')
        pendingSpeakAfterAdvanceRef.current = true
        return
      }

      if (currentSlideIndex + 1 < slides.length) {
        const nextSlideIndex = currentSlideIndex + 1
        setCurrentSlideIndex(nextSlideIndex)
        onSlideView?.()
        await speakSlideExplanation(nextSlideIndex)
        return
      }

      pendingSpeakAfterAdvanceRef.current = true
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

  const continueLabel = advancing ? 'Continuing…' : 'Continue'

  return (
    <div className="classroom-shell">
      <LearningStatsBar compact sessionStep={sessionStep} />

      <div className="lesson-chrome">
        <div className="lesson-chrome-meta">
          <p className="lesson-chrome-kicker">
            <Icon icon={Radio} size={12} />
            Live lesson
          </p>
          <p className="lesson-chrome-title">{stateLabel}</p>
          <p className="lesson-chrome-motivation">{motivationalKicker}</p>
        </div>
        {slideProgress !== null ? (
          <div className="journey-progress lesson-progress-wrap">
            <p className="journey-progress-label" id="slide-progress-label">
              Slide {slideProgress.current} of {slideProgress.total}
            </p>
            <div
              className="journey-progress-bar"
              role="progressbar"
              aria-labelledby="slide-progress-label"
              aria-valuenow={slideProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`journey-progress-fill${slideProgress.percent === 100 ? ' is-milestone' : ''}`}
                style={{ width: `${slideProgress.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="journey-progress lesson-progress-wrap">
            <p className="journey-progress-label" id="session-progress-label">
              Step {sessionStep} of your session
            </p>
            <div
              className="journey-progress-bar"
              role="progressbar"
              aria-labelledby="session-progress-label"
              aria-valuenow={Math.min(sessionStep * 12, 96)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="journey-progress-fill" style={{ width: `${Math.min(sessionStep * 12, 96)}%` }} />
            </div>
          </div>
        )}
        <div className="lesson-chrome-actions">
          {isSupported ? (
            <button
              type="button"
              className={`btn btn-secondary btn-with-icon${speechEnabled ? ' is-active-audio' : ''}`}
              onClick={() => { void handleEnableSpeech() }}
              aria-pressed={speechEnabled}
            >
              <Icon icon={speechEnabled ? Volume2 : VolumeX} size={16} />
              {speechEnabled ? 'Audio on' : 'Enable audio'}
            </button>
          ) : null}
        </div>
      </div>

      <CelebrationMoment
        show={celebration !== null}
        title={celebration?.title ?? ''}
        subtitle={celebration?.subtitle}
        xp={celebration?.xp}
        onDismiss={() => setCelebration(null)}
      />

      {milestoneMessage !== null && slideProgress?.percent !== 100 ? (
        <p className="lesson-milestone">{milestoneMessage}</p>
      ) : null}

      {speechError !== null ? (
        <ErrorState message={speechError} />
      ) : null}

      <div className="classroom-layout">
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
                    void speakAsMentor(reaction.line, false)
                  }
                  onQuizResult?.(correct)
                }}
              />
            ) : stateType === 'student_predict' ? (
              <div className="predict-panel">
                <SlideRenderer elements={currentSlide?.elements ?? []} />
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
              <SlideRenderer elements={currentSlide?.elements ?? []} />
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
                <Icon icon={ChevronRight} size={16} />
              </button>
            ) : null}
          </div>
        </section>

        <aside className="avatar-area card avatar-area-compact">
          <StudyMentorAvatar
            mentor={activeMentor}
            expression={expression}
            caption={avatarCaption}
            size="md"
            ariaLabel={`${activeMentor.name}, your study mentor`}
          />
          {explanationText.trim() !== '' && speechEnabled ? (
            <button
              type="button"
              className="btn btn-secondary btn-with-icon replay-btn"
              onClick={() => { void speakAsMentor(explanationText) }}
            >
              <Icon icon={RotateCcw} size={16} />
              Replay
            </button>
          ) : null}
        </aside>
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
            <Icon icon={ChevronRight} size={16} />
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
