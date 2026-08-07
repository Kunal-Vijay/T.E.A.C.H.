import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ClassroomExitLink from '../../components/nav/ClassroomExitLink'
import ClassroomLayout from '../../components/classroom/ClassroomLayout'
import SessionCompleteScreen from '../../components/delight/SessionCompleteScreen'
import CelebrationMoment from '../../components/delight/CelebrationMoment'
import StatusPanel from '../../components/status/StatusPanel'
import ErrorState from '../../components/ui/ErrorState'
import {
  COURSE_COMPLETE_LINES,
  LESSON_COMPLETE_LINES,
  pickRandom,
  TOPIC_COMPLETE_LINES,
} from '../../constants/delightCopy'
import { XP_REWARDS } from '../../constants/xp'
import { useLearningProgress } from '../../context/LearningProgressContext'
import { useToast } from '../../context/ToastContext'
import { trackEvent } from '../../lib/analytics'
import { captureException } from '../../lib/monitoring'
import { getUserMessage, logDisplayedError, resolveDisplayedError } from '../../services/api/apiError'
import { classroomApi } from '../../services/api/classroomApi'
import { quizApi } from '../../services/api/quizApi'
import { sageApi } from '../../services/api/sageApi'
import {
  clearClassroomSession,
  getClassroomSessionId,
  getStudentId,
  setClassroomSessionId,
} from '../../services/auth/authService'
import { isApiError } from '../../services/api/apiError'
import type { CurrentStateResponse } from '../../types/api.types'

interface SessionStats {
  xpEarned: number
  quizCorrect: number
  quizTotal: number
  sageQuestions: number
  statesCompleted: number
}

interface CelebrationState {
  title: string
  subtitle?: string
  xp?: number
}

export default function ClassroomPage() {
  const { generationId = '' } = useParams()
  const { pushToast } = useToast()
  const {
    startSession,
    recordSlideView,
    recordPrediction,
    recordQuizAnswer,
    recordSageQuestion,
    completeLesson,
    completeTopic,
    completeCourse,
  } = useLearningProgress()

  const [sessionId, setSessionId] = useState<string | null>(() => getClassroomSessionId(generationId))
  const [currentState, setCurrentState] = useState<CurrentStateResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionStep, setSessionStep] = useState(1)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)

  const previousTopicIdRef = useRef<string | undefined>(undefined)
  const courseCompletedRef = useRef(false)
  const sessionStatsRef = useRef<SessionStats>({
    xpEarned: 0,
    quizCorrect: 0,
    quizTotal: 0,
    sageQuestions: 0,
    statesCompleted: 0,
  })

  const trackXp = useCallback((amount: number) => {
    sessionStatsRef.current.xpEarned += amount
  }, [])

  const showAchievement = useCallback((achievement: { title: string; description: string } | null) => {
    if (achievement === null) {
      return
    }
    pushToast(`${achievement.title} — ${achievement.description}`, 'celebrate')
  }, [pushToast])

  const handleActionError = useCallback((error: unknown, action: string) => {
    logDisplayedError(error, {
      component: 'ClassroomPage',
      action,
      generationId,
      ...(sessionId !== null ? { sessionId } : {}),
    })
    captureException(error, {
      action,
      generationId,
      ...(sessionId !== null ? { sessionId } : {}),
    })
    const message = getUserMessage(error, 'Something went wrong. Try again.')
    if (message !== '') {
      pushToast(message, 'error')
    }
  }, [generationId, pushToast, sessionId])

  const handleCompletedSession = useCallback(() => {
    if (courseCompletedRef.current) {
      return
    }
    courseCompletedRef.current = true
    const stats = sessionStatsRef.current
    trackXp(XP_REWARDS.COURSE_COMPLETE)
    const achievement = completeCourse({
      xpEarned: stats.xpEarned + XP_REWARDS.COURSE_COMPLETE,
      quizCorrect: stats.quizCorrect,
      quizTotal: stats.quizTotal,
      sageQuestions: stats.sageQuestions,
      statesCompleted: stats.statesCompleted,
    })
    showAchievement(achievement)
    setCelebration({
      title: pickRandom(COURSE_COMPLETE_LINES),
      subtitle: 'Full course complete. That’s real progress.',
      xp: XP_REWARDS.COURSE_COMPLETE,
    })
    trackEvent('course_completed', { generationId })
    pushToast('Course complete — well done.', 'celebrate')
  }, [completeCourse, generationId, pushToast, showAchievement, trackXp])

  const applyStateResponse = useCallback((response: CurrentStateResponse) => {
    if (response.session_status === 'completed') {
      handleCompletedSession()
      setCurrentState(response)
      return
    }

    const topicChanged =
      previousTopicIdRef.current !== undefined
      && response.topic_id !== undefined
      && previousTopicIdRef.current !== response.topic_id

    if (topicChanged) {
      trackXp(XP_REWARDS.TOPIC_COMPLETE)
      completeTopic()
      setCelebration({
        title: pickRandom(TOPIC_COMPLETE_LINES),
        subtitle: 'Moving to the next chapter of the class.',
        xp: XP_REWARDS.TOPIC_COMPLETE,
      })
      pushToast('Topic complete — onward.', 'celebrate')
    }

    previousTopicIdRef.current = response.topic_id
    setCurrentState(response)
  }, [completeTopic, handleCompletedSession, pushToast, trackXp])

  useEffect(() => {
    let cancelled = false
    startSession()

    const initialize = async () => {
      setErrorMessage(null)
      try {
        let activeSessionId = getClassroomSessionId(generationId)
        if (activeSessionId !== null && activeSessionId !== '') {
          try {
            const existingResponse = await classroomApi.getCurrent(activeSessionId)
            if (cancelled) {
              return
            }
            setSessionId(activeSessionId)
            applyStateResponse(existingResponse.data)
            setErrorMessage(null)
            return
          } catch (error) {
            if (!isApiError(error) || error.status !== 404) {
              throw error
            }
            clearClassroomSession(generationId)
            activeSessionId = null
          }
        }

        const response = await classroomApi.create(generationId, getStudentId())
        if (cancelled) {
          return
        }
        activeSessionId = response.data.session_id
        setClassroomSessionId(generationId, activeSessionId)
        setSessionId(activeSessionId)
        trackEvent('classroom_session_created', { generationId })

        const currentResponse = await classroomApi.getCurrent(activeSessionId)
        if (cancelled) {
          return
        }
        applyStateResponse(currentResponse.data)
        setErrorMessage(null)
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { action: 'init_classroom', generationId })
        const message = resolveDisplayedError(error, {
          component: 'ClassroomPage',
          action: 'init_classroom',
          generationId,
        }, 'Failed to load classroom session')
        if (message !== null) {
          setErrorMessage(message)
        }
      }
    }

    void initialize()
    return () => {
      cancelled = true
    }
  }, [applyStateResponse, generationId, startSession])

  const handleAdvance = async () => {
    if (sessionId === null) {
      return
    }
    try {
      const response = await classroomApi.advance(sessionId)
      sessionStatsRef.current.statesCompleted += 1
      setSessionStep((step) => step + 1)
      trackXp(XP_REWARDS.STATE_COMPLETE)
      const achievement = completeLesson()
      showAchievement(achievement)
      setCelebration({
        title: pickRandom(LESSON_COMPLETE_LINES),
        subtitle: 'Another moment locked in.',
        xp: XP_REWARDS.STATE_COMPLETE,
      })
      applyStateResponse(response.data)
    } catch (error) {
      handleActionError(error, 'advance')
    }
  }

  if (errorMessage !== null) {
    return (
      <main className="classroom-canvas">
        <header className="classroom-page-chrome">
          <ClassroomExitLink variant="standalone" />
        </header>
        <div className="container page-main">
          <ErrorState message={errorMessage} />
        </div>
      </main>
    )
  }

  if (currentState === null || sessionId === null) {
    return (
      <main className="classroom-canvas">
        <div className="container page-main">
          <StatusPanel
            tone="loading"
            title="Preparing your classroom..."
            description="Setting up slides, voice, and your live lesson flow."
          />
        </div>
      </main>
    )
  }

  if (currentState.session_status === 'completed') {
    return (
      <main className="classroom-canvas">
        <header className="classroom-page-chrome">
          <ClassroomExitLink variant="standalone" />
        </header>
        <div className="container page-main">
          <SessionCompleteScreen
          summary={{
            id: sessionId,
            completedAt: new Date().toISOString(),
            xpEarned: sessionStatsRef.current.xpEarned || XP_REWARDS.COURSE_COMPLETE,
            quizCorrect: sessionStatsRef.current.quizCorrect,
            quizTotal: sessionStatsRef.current.quizTotal,
            sageQuestions: sessionStatsRef.current.sageQuestions,
            statesCompleted: sessionStatsRef.current.statesCompleted,
          }}
          onClose={() => { /* summary is the end state */ }}
        />
        </div>
      </main>
    )
  }

  const lessonInProgress =
    currentState.session_status === 'active'
    && sessionStep > 1

  const exitControl = (
    <ClassroomExitLink requireConfirm={lessonInProgress} variant="breadcrumb" />
  )

  return (
    <main className="classroom-canvas">
      <CelebrationMoment
        show={celebration !== null}
        title={celebration?.title ?? ''}
        subtitle={celebration?.subtitle}
        xp={celebration?.xp}
        onDismiss={() => setCelebration(null)}
      />
      <ClassroomLayout
        currentState={currentState}
        sessionStep={sessionStep}
        exitControl={exitControl}
        onAdvance={handleAdvance}
        onSubmitPrediction={async (predictionText) => {
          try {
            const response = await classroomApi.submitPrediction(sessionId, predictionText)
            sessionStatsRef.current.statesCompleted += 1
            setSessionStep((step) => step + 1)
            applyStateResponse(response.data)
          } catch (error) {
            handleActionError(error, 'submit_prediction')
            throw error
          }
        }}
        onQuizSubmit={async (questionId, selectedOptionId) => {
          try {
            const response = await quizApi.submitAttempt(sessionId, questionId, selectedOptionId)
            return response.data
          } catch (error) {
            handleActionError(error, 'quiz_submit')
            throw error
          }
        }}
        onOpenSage={async () => {
          try {
            const response = await sageApi.createSession(sessionId)
            trackEvent('sage_opened', { generationId })
            return response.data.doubt_session_id
          } catch (error) {
            handleActionError(error, 'sage_open')
            throw error
          }
        }}
        onAskSage={async (doubtSessionId, message) => {
          try {
            const response = await sageApi.ask(doubtSessionId, message)
            return response.data
          } catch (error) {
            handleActionError(error, 'sage_ask')
            throw error
          }
        }}
        onCloseSage={async (doubtSessionId) => {
          try {
            const response = await sageApi.close(doubtSessionId)
            applyStateResponse(response.data)
          } catch (error) {
            handleActionError(error, 'sage_close')
          }
        }}
        onSkipDoubts={async () => {
          try {
            const response = await classroomApi.skipDoubts(sessionId)
            applyStateResponse(response.data)
          } catch (error) {
            handleActionError(error, 'skip_doubts')
          }
        }}
        onSlideView={() => {
          recordSlideView()
          trackXp(XP_REWARDS.SLIDE)
        }}
        onPrediction={() => {
          recordPrediction()
          trackXp(XP_REWARDS.PREDICTION)
        }}
        onQuizResult={(correct) => {
          sessionStatsRef.current.quizTotal += 1
          if (correct) {
            sessionStatsRef.current.quizCorrect += 1
          }
          trackXp(correct ? XP_REWARDS.QUIZ_CORRECT : XP_REWARDS.QUIZ_TRY)
          const achievement = recordQuizAnswer(correct)
          showAchievement(achievement)
          if (correct) {
            pushToast(`+${XP_REWARDS.QUIZ_CORRECT} XP — sharp answer.`, 'celebrate')
          }
        }}
        onSageQuestion={() => {
          sessionStatsRef.current.sageQuestions += 1
          trackXp(XP_REWARDS.SAGE_ASK)
          const achievement = recordSageQuestion()
          showAchievement(achievement)
        }}
        onReleaseDoubtSession={async (doubtSessionId) => {
          try {
            await sageApi.close(doubtSessionId)
          } catch {
            /* Mid-lesson doubt — closing is best-effort; lesson state stays put */
          }
        }}
      />
    </main>
  )
}
