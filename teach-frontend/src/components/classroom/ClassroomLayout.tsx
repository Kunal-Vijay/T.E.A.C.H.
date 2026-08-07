import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { TeachingLayout, LessonRhythmBar } from './ImmersiveClassroom'
import SageDoubtPanel from '../sage/SageDoubtPanel'
import VoiceDoubtPrompt from '../voice-doubt/VoiceDoubtPrompt'
import VoiceDoubtSheet, { type VoiceDoubtSheetMode, type VoiceDoubtSheetPhase } from '../voice-doubt/VoiceDoubtSheet'
import CelebrationMoment from '../delight/CelebrationMoment'
import ErrorState from '../ui/ErrorState'
import Icon from '../ui/Icon'
import SlideRenderer from '../slides/SlideRenderer'
import { pickRandom, SLIDE_MILESTONES, LESSON_COMPLETE_LINES } from '../../constants/delightCopy'
import { pickDoubtInvitation } from '../../constants/doubtCopy'
import { XP_REWARDS } from '../../constants/xp'
import { useTeachingSession } from '../../hooks/useTeachingSession'
import { useLessonSectionFlow } from '../../hooks/useLessonSectionFlow'
import { useMentor } from '../../context/MentorContext'
import { classroomModeToExpression } from '../../lib/mentors'
import { resolveClassroomNovaContext } from '../../lib/tutor/classroomNovaContext'
import { extractConceptLabels } from '../../lib/classroom/conceptLabels'
import { isNovaNarrating, resolveTutorPresence, useNovaSpeakingVisual } from '../../lib/tutor'
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
  exitControl?: ReactNode
  onAdvance: () => Promise<void>
  onSubmitPrediction: (predictionText: string) => Promise<void>
  onOpenSage: () => Promise<string>
  onAskSage: (doubtSessionId: string, message: string) => Promise<import('../../types/api.types').DoubtMessageResponse>
  onCloseSage: (doubtSessionId: string) => Promise<void>
  onSkipDoubts: () => Promise<void>
  onSlideView?: () => void
  onPrediction?: () => void
  onSageQuestion?: () => void
  onReleaseDoubtSession?: (doubtSessionId: string) => Promise<void>
}

export default function ClassroomLayout({
  currentState,
  exitControl,
  onAdvance,
  onSubmitPrediction,
  onOpenSage,
  onAskSage,
  onCloseSage,
  onSkipDoubts,
  onSlideView,
  onPrediction,
  onSageQuestion,
  onReleaseDoubtSession,
}: ClassroomLayoutProps) {
  const { tutor, expression, setExpression, pulseExpression } = useMentor()
  const activeTutor = tutor
  const [predictionText, setPredictionText] = useState('')
  const [showSagePanel, setShowSagePanel] = useState(false)
  const [doubtSessionId, setDoubtSessionId] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [syncedSubtitle, setSyncedSubtitle] = useState({ current: '', previous: '' })
  const lastMilestoneRef = useRef(0)
  const doubtPromptSpokenRef = useRef(false)
  const markNarrationCompleteRef = useRef<() => void>(() => {})
  const narrationCompleteTimerRef = useRef<number | null>(null)

  const [doubtSheet, setDoubtSheet] = useState<{
    mode: VoiceDoubtSheetMode
    phase: VoiceDoubtSheetPhase
    answerText?: string
  } | null>(null)
  const [voiceDoubtPermissionMsg, setVoiceDoubtPermissionMsg] = useState<string | null>(null)
  const [doubtInvitationLine, setDoubtInvitationLine] = useState('Ask me anything before we continue.')

  const { speechStatus, speechError, speakAsMentor: speakMentorLine, speakLessonContent, stopPreview, warmUp, isSupported } = useMentorVoice()

  const slides = currentState.content?.slides ?? []
  const currentSlide = slides[currentSlideIndex]
  const stateType = currentState.current_state?.state_type
  const slideElements = useMemo(() => currentSlide?.elements ?? [], [currentSlide?.elements])
  const explanationText = currentSlide?.explanation?.explanation_text ?? ''
  const slideDoubtKey = `${currentState.current_state?.state_id ?? 'state'}-${currentSlideIndex}`

  const isLiveLesson =
    stateType !== 'student_predict'
    && stateType !== 'doubts_resolution'

  const sectionFlow = useLessonSectionFlow({
    slideKey: slideDoubtKey,
    isLiveLesson,
  })

  const {
    phase: sectionPhase,
    isTeaching,
    lessonPaused,
    showVoiceDoubtPrompt,
    readyToContinue,
    markNarrationComplete,
    onReplayStarted,
    openDoubt,
    finishDoubt,
  } = sectionFlow

  markNarrationCompleteRef.current = markNarrationComplete

  const stateLabel = currentState.current_state?.label ?? 'Lesson'

  const session = useTeachingSession(explanationText, slideElements)

  const sessionRef = useRef(session)
  sessionRef.current = session

  const scheduleNarrationComplete = useCallback(() => {
    if (narrationCompleteTimerRef.current !== null) {
      return
    }
    narrationCompleteTimerRef.current = window.setTimeout(() => {
      narrationCompleteTimerRef.current = null
      markNarrationCompleteRef.current()
    }, 1200)
  }, [])

  const playLesson = useCallback(async (text: string) => {
    if (text.trim() === '') {
      return
    }
    sessionRef.current.resetSession()
    setSyncedSubtitle({ current: '', previous: '' })
    await speakLessonContent(activeTutor, text, {
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
      onEnd: () => {
        sessionRef.current.onPlaybackEnd()
        scheduleNarrationComplete()
      },
      onCancel: () => setSyncedSubtitle({ current: '', previous: '' }),
    })
  }, [activeTutor, speakLessonContent, scheduleNarrationComplete])

  const playLessonRef = useRef(playLesson)
  playLessonRef.current = playLesson

  const speakAsMentor = async (text: string) => {
    await speakMentorLine(activeTutor, text)
  }

  useEffect(() => {
    setCurrentSlideIndex(0)
    lastMilestoneRef.current = 0
    session.resetSession()
  }, [currentState.current_state?.state_id, session.resetSession])

  useEffect(() => {
    session.resetSession()
    setSyncedSubtitle({ current: '', previous: '' })
    setDoubtSheet(null)
    setVoiceDoubtPermissionMsg(null)
    doubtPromptSpokenRef.current = false
    if (narrationCompleteTimerRef.current !== null) {
      window.clearTimeout(narrationCompleteTimerRef.current)
      narrationCompleteTimerRef.current = null
    }
  }, [currentSlideIndex, explanationText, session.resetSession])

  useEffect(() => {
    if (!isLiveLesson || !isTeaching) {
      return
    }
    if (speechStatus !== 'idle') {
      return
    }
    if (!session.playbackComplete) {
      return
    }
    scheduleNarrationComplete()
  }, [
    isLiveLesson,
    isTeaching,
    speechStatus,
    session.playbackComplete,
    scheduleNarrationComplete,
  ])

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
      return
    }
    session.markManualPlaybackComplete()
    scheduleNarrationComplete()
  }

  const handleReplay = () => {
    stopPreview()
    onReplayStarted()
    setDoubtSheet(null)
    setVoiceDoubtPermissionMsg(null)
    doubtPromptSpokenRef.current = false
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

  useEffect(() => {
    if (!showVoiceDoubtPrompt) {
      return
    }
    if (doubtPromptSpokenRef.current) {
      return
    }
    doubtPromptSpokenRef.current = true
    const line = pickDoubtInvitation()
    setDoubtInvitationLine(line)
    stopPreview()
    if (speechEnabled) {
      void speakMentorLine(activeTutor, line)
    }
  }, [showVoiceDoubtPrompt, speechEnabled, activeTutor, speakMentorLine, stopPreview])

  const submitDoubtQuestion = async (sessionId: string, message: string) => {
    setDoubtSheet((previous) => (
      previous !== null
        ? { ...previous, phase: 'thinking' }
        : { mode: 'type', phase: 'thinking' }
    ))
    setExpression(activeTutor.expression.onThink)

    const response = await onAskSage(sessionId, message)
    onSageQuestion?.()

    setDoubtSheet((previous) => (
      previous !== null
        ? { ...previous, phase: 'answer', answerText: response.ai_response }
        : { mode: 'type', phase: 'answer', answerText: response.ai_response }
    ))

    if (speechEnabled) {
      await speakMentorLine(activeTutor, response.ai_response, {
        onSentenceStart: (_index, sentence) => {
          setSyncedSubtitle((previous) => ({
            previous: previous.current,
            current: sentence,
          }))
        },
      })
    } else {
      setSyncedSubtitle({ current: response.ai_response, previous: '' })
    }

    if (onReleaseDoubtSession !== undefined) {
      await onReleaseDoubtSession(sessionId)
    }

    dismissVoiceDoubtForSlide()
  }

  const dismissVoiceDoubtForSlide = () => {
    setDoubtSheet(null)
    setVoiceDoubtPermissionMsg(null)
    setDoubtSessionId(null)
    finishDoubt()
  }

  const openVoiceDoubt = async (mode: VoiceDoubtSheetMode) => {
    stopPreview()
    warmUp()
    setVoiceDoubtPermissionMsg(null)
    openDoubt()
    try {
      const sessionId = await onOpenSage()
      setDoubtSessionId(sessionId)
      setDoubtSheet({
        mode,
        phase: mode === 'voice' ? 'listening' : 'typing',
      })
    } catch {
      setDoubtSheet(null)
    }
  }

  const handleVoiceDoubtSend = async (message: string) => {
    if (doubtSessionId === null) {
      return
    }

    try {
      await submitDoubtQuestion(doubtSessionId, message)
    } catch {
      setDoubtSheet((previous) => (
        previous !== null
          ? { ...previous, phase: previous.mode === 'voice' ? 'listening' : 'typing' }
          : previous
      ))
    }
  }

  const handleQuickAsk = async (message: string) => {
    stopPreview()
    warmUp()
    setVoiceDoubtPermissionMsg(null)
    openDoubt()
    try {
      const sessionId = await onOpenSage()
      setDoubtSessionId(sessionId)
      await submitDoubtQuestion(sessionId, message)
    } catch {
      setDoubtSheet(null)
      setDoubtSessionId(null)
    }
  }

  const handleVoiceDoubtClose = () => {
    stopPreview()
    if (doubtSessionId !== null && onReleaseDoubtSession !== undefined) {
      void onReleaseDoubtSession(doubtSessionId)
    }
    dismissVoiceDoubtForSlide()
  }

  const handleSwitchToType = () => {
    setVoiceDoubtPermissionMsg(
      'Microphone access isn\'t available. You can type your question instead.',
    )
    openDoubt()
    setDoubtSheet((previous) => (
      previous !== null
        ? { ...previous, mode: 'type', phase: 'typing' }
        : { mode: 'type', phase: 'typing' }
    ))
  }

  const handleContinue = async () => {
    if (advancing || lessonPaused) {
      return
    }

    if (isLiveLesson && !speechEnabled && !session.hasStarted && session.cues.length > 0) {
      handleStartWithoutAudio()
      return
    }

    if (isLiveLesson && !speechEnabled && session.hasStarted && !session.playbackComplete) {
      const nextIndex = Math.min(
        session.activeCueIndex + 1,
        Math.max(0, session.cues.length - 1),
      )
      session.advanceCueManually()
      if (nextIndex >= session.cues.length - 1 && session.cues.length > 0) {
        scheduleNarrationComplete()
      }
      return
    }

    if (isLiveLesson && !readyToContinue) {
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
    sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'listening'
      ? 'listening'
      : sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'thinking'
        ? 'listening'
        : stateType === 'student_predict' || showSagePanel
          ? 'listening'
          : speechStatus === 'speaking'
            ? 'speaking'
            : 'idle'

  useEffect(() => {
    if (showVoiceDoubtPrompt) {
      setExpression('smile')
      return
    }

    if (sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'thinking') {
      setExpression(activeTutor.expression.onThink)
      return
    }

    if (speechStatus === 'speaking') {
      setExpression(activeTutor.expression.onSpeak)
      return
    }

    const modeExpression = classroomModeToExpression(resolvedAvatarMode)
    if (modeExpression === 'listening') {
      setExpression(activeTutor.expression.onListen)
    } else if (modeExpression === 'curious') {
      setExpression('curious')
    } else if (modeExpression === 'speaking' || modeExpression === 'explaining') {
      setExpression(activeTutor.expression.onSpeak)
    } else {
      setExpression(activeTutor.expression.onIdle)
    }
  }, [resolvedAvatarMode, speechStatus, activeTutor, setExpression, sectionPhase, doubtSheet?.phase, showVoiceDoubtPrompt])

  useEffect(() => {
    if (celebration !== null) {
      pulseExpression('celebrating')
    }
  }, [celebration, pulseExpression])

  const showContinue = (() => {
    if (isLiveLesson) {
      if (lessonPaused) {
        return false
      }
      if (readyToContinue) {
        return true
      }
      if (!speechEnabled && isTeaching) {
        return stateType !== 'doubts_resolution'
      }
      return false
    }
    return stateType !== 'doubts_resolution'
      && !(stateType === 'student_predict' && predictionText.trim() === '')
  })()

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

  const isNarrating = isNovaNarrating(speechStatus)
  const showSpeaking = useNovaSpeakingVisual(isNarrating)
  const isListening = !showSpeaking && (
    resolvedAvatarMode === 'listening'
    || showVoiceDoubtPrompt
    || (sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'listening')
    || stateType === 'student_predict'
    || showSagePanel
  )
  const isThinking = !showSpeaking && !isListening && (
    sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'thinking'
  )
  const tutorPresence = useMemo(
    () => resolveTutorPresence({
      showSpeaking,
      isListening,
      isThinking,
      hasStarted: session.hasStarted,
    }),
    [showSpeaking, isListening, isThinking, session.hasStarted],
  )
  const conceptLabels = useMemo(
    () => extractConceptLabels(session.beats),
    [session.beats],
  )
  const subtitleCurrent = syncedSubtitle.current.trim() !== ''
    ? syncedSubtitle.current
    : session.currentCue
  const subtitlePrevious = syncedSubtitle.current.trim() !== ''
    ? syncedSubtitle.previous
    : session.previousCue

  const classroomNova = useMemo(
    () => resolveClassroomNovaContext({
      expression,
      speechStatus,
      isListening:
        resolvedAvatarMode === 'listening'
        || showVoiceDoubtPrompt
        || (sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'listening')
        || stateType === 'student_predict'
        || showSagePanel,
      isThinking:
        (sectionPhase === 'answering_doubt' && doubtSheet?.phase === 'thinking')
        || (isLiveLesson && !session.hasStarted && !isNarrating),
      isCelebrating: celebration !== null || session.activeBeat?.phase === 'recap',
      preferHappy: showVoiceDoubtPrompt,
    }),
    [
      expression,
      speechStatus,
      resolvedAvatarMode,
      showVoiceDoubtPrompt,
      sectionPhase,
      doubtSheet?.phase,
      stateType,
      showSagePanel,
      isLiveLesson,
      session.hasStarted,
      session.activeBeat?.phase,
      isNarrating,
      celebration,
    ],
  )
  const mentorTheme = {
    '--mentor-accent': activeTutor.visual.accent,
    '--mentor-glow': activeTutor.visual.glow,
  } as CSSProperties

  if (isLiveLesson) {
    return (
      <div className="classroom-live immersive-classroom" style={mentorTheme}>
        <LessonRhythmBar
          lessonTitle={stateLabel}
          slideCurrent={currentSlideIndex + 1}
          slideTotal={Math.max(slides.length, 1)}
          sessionProgress={session.sessionProgress}
          cueIndex={session.activeCueIndex}
          totalCues={session.cues.length}
          tutorPresence={tutorPresence}
          exitControl={exitControl}
        />

        <CelebrationMoment
          show={celebration !== null}
          title={celebration?.title ?? ''}
          subtitle={celebration?.subtitle}
          xp={celebration?.xp}
          onDismiss={() => setCelebration(null)}
        />

        <TeachingLayout
          mentor={activeTutor}
          expression={classroomNova.expression}
          isTalking={classroomNova.isTalking}
          slideElements={slideElements}
          slideKey={`${currentState.current_state?.state_id ?? 'state'}-${currentSlideIndex}`}
          currentCue={subtitleCurrent}
          previousCue={subtitlePrevious}
          cueIndex={session.activeCueIndex}
          totalCues={session.cues.length}
          showSpeaking={showSpeaking}
          tutorPresence={tutorPresence}
          hasStarted={session.hasStarted}
          beat={session.activeBeat}
          beats={session.beats}
          conceptLabels={conceptLabels}
          completedConcepts={session.completedConcepts}
          speechEnabled={speechEnabled}
          speechSupported={isSupported}
          speechError={speechError}
          playbackComplete={session.playbackComplete}
          onEnableSpeech={() => { void handleEnableSpeech() }}
          onToggleSpeech={() => { void handleEnableSpeech() }}
          onReplay={handleReplay}
          canReplay={explanationText.trim() !== ''}
          continueLabel={continueLabel}
          continueDisabled={advancing || (isNarrating && speechEnabled) || lessonPaused}
          continueLoading={advancing}
          onContinue={() => { void handleContinue() }}
          showContinue={showContinue}
        />

        <VoiceDoubtPrompt
          visible={showVoiceDoubtPrompt}
          mentor={activeTutor}
          invitationLine={doubtInvitationLine}
          onAskVoice={() => { void openVoiceDoubt('voice') }}
          onAskType={() => { void openVoiceDoubt('type') }}
          onQuickAsk={(message) => { void handleQuickAsk(message) }}
          onSkip={dismissVoiceDoubtForSlide}
        />

        {doubtSheet !== null ? (
          <VoiceDoubtSheet
            open
            mode={doubtSheet.mode}
            mentor={activeTutor}
            phase={doubtSheet.phase}
            showSpeaking={showSpeaking}
            answerText={doubtSheet.answerText}
            permissionDeniedMessage={voiceDoubtPermissionMsg}
            onClose={handleVoiceDoubtClose}
            onSend={handleVoiceDoubtSend}
            onSwitchToType={handleSwitchToType}
          />
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

  return (
    <div className="classroom-classic classroom-shell">
      {exitControl !== undefined ? (
        <div className="classroom-classic-chrome">{exitControl}</div>
      ) : null}
      <CelebrationMoment
        show={celebration !== null}
        title={celebration?.title ?? ''}
        subtitle={celebration?.subtitle}
        xp={celebration?.xp}
        onDismiss={() => setCelebration(null)}
      />

      {speechError !== null ? <ErrorState message={speechError} /> : null}

      <div className="classroom-classic-layout classroom-layout classroom-layout-classic">
        <section className="classroom-classic-main slide-area card">
          <div className="slide-content">
            {stateType === 'student_predict' ? (
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
                  <p className="sage-launch-kicker">Need help?</p>
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
