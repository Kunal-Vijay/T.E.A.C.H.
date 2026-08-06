import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import PageHeader from '../../components/ui/PageHeader'
import SkeletonCardGrid from '../../components/ui/SkeletonCardGrid'
import StatusPanel from '../../components/status/StatusPanel'
import ErrorState from '../../components/ui/ErrorState'
import Icon from '../../components/ui/Icon'
import LearningStatsBar from '../../components/delight/LearningStatsBar'
import { dailyGoalLede } from '../../constants/delightCopy'
import { useLearningProgress } from '../../context/LearningProgressContext'
import { useToast } from '../../context/ToastContext'
import { trackEvent } from '../../lib/analytics'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { classPlanApi } from '../../services/api/classPlanApi'
import { generationApi } from '../../services/api/generationApi'
import { classroomApi } from '../../services/api/classroomApi'
import {
  getStudentId,
  isStudentOnboarded,
  markStudentOnboarded,
  setClassroomSessionId,
} from '../../services/auth/authService'
import { useMentor } from '../../context/MentorContext'
import type { ClassPlanResponse, GenerationStatusResponse } from '../../types/api.types'

interface AvailableClass {
  classPlan: ClassPlanResponse
  generation: GenerationStatusResponse
}

const STUDENT_STEPS = [
  { title: 'Join your class' },
  { title: 'Attend the lesson' },
  { title: 'Ask SAGE anything' },
]

function prefetchClassroomRoute(): void {
  void import('./ClassroomPage')
}

export default function StudentClassCatalogPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { progress } = useLearningProgress()
  const { mentor } = useMentor()
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => !isStudentOnboarded())

  useEffect(() => {
    let cancelled = false

    const loadAvailableClasses = async () => {
      setErrorMessage(null)
      try {
        const response = await classPlanApi.list({ status: 'published' })
        if (cancelled) {
          return
        }
        const items = response.data.items
        const pairs = await Promise.all(
          items.map(async (classPlan) => {
            const detailResponse = await classPlanApi.get(classPlan.plan_id)
            const latestGeneration = detailResponse.data.latest_generation
            if (latestGeneration == null) {
              return null
            }
            const generationResponse = await generationApi.getStatus(latestGeneration.generation_id)
            const status = generationResponse.data.status
            if (status === 'completed' || status === 'completed_with_warnings') {
              return { classPlan, generation: generationResponse.data }
            }
            return null
          }),
        )
        if (cancelled) {
          return
        }
        setAvailableClasses(pairs.filter((item): item is AvailableClass => item !== null))
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'student_catalog' })
        const message = resolveDisplayedError(error, {
          component: 'StudentClassCatalogPage',
          action: 'load_available_classes',
        }, 'Failed to load available classes')
        if (message !== null) {
          setErrorMessage(message)
          pushToast(message, 'error')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadAvailableClasses()
    return () => {
      cancelled = true
    }
  }, [pushToast])

  const attendClass = async (generationId: string) => {
    setJoiningId(generationId)
    setErrorMessage(null)
    try {
      const response = await classroomApi.create(generationId, getStudentId())
      setClassroomSessionId(generationId, response.data.session_id)
      trackEvent('class_joined', { generationId })
      pushToast('Joining class…', 'info')
      navigate(`/student/classroom/${generationId}`)
    } catch (error) {
      captureException(error, { action: 'join_class', generationId })
      const message = resolveDisplayedError(error, {
        component: 'StudentClassCatalogPage',
        action: 'join_class',
        generationId,
      }, 'Failed to join class')
      if (message !== null) {
        setErrorMessage(message)
        pushToast(message, 'error')
      }
    } finally {
      setJoiningId(null)
    }
  }

  const browseClasses = () => {
    markStudentOnboarded()
    setShowOnboarding(false)
  }

  return (
    <main className="container page-main">
      {errorMessage !== null ? <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} /> : null}

      {loading ? (
        <>
          <PageHeader
            kicker="Student"
            title="Available classes"
            lede="Join a ready lesson — slides, voice, quizzes, and SAGE included."
          />
          <SkeletonCardGrid count={6} />
        </>
      ) : null}

      {!loading && showOnboarding ? (
        <OnboardingPanel
          heading="Welcome to TEACH"
          steps={STUDENT_STEPS}
          ctaLabel="Browse Classes"
          onCta={browseClasses}
          footnote={
            availableClasses.length === 0
              ? 'No classes are ready yet. Ask your teacher to publish a class and generate it.'
              : undefined
          }
        />
      ) : null}

      {!loading && !showOnboarding ? (
        <>
          <PageHeader
            kicker={mentor !== null ? `With ${mentor.name}` : 'Student'}
            title="Available classes"
            lede={dailyGoalLede(progress.lessonsCompletedToday, progress.dailyGoal, progress.streak)}
          />
          <LearningStatsBar />
          <section className="catalog-section" aria-label="Class catalog">
            {availableClasses.length > 0 ? (
              <div className="grid-cards">
                {availableClasses.map(({ classPlan, generation }) => {
                  const isJoining = joiningId === generation.generation_id
                  return (
                    <div
                      className="card class-card"
                      key={generation.generation_id}
                      onMouseEnter={prefetchClassroomRoute}
                      onFocus={prefetchClassroomRoute}
                    >
                      <span className="badge badge-ready">Ready</span>
                      <h3>{classPlan.title}</h3>
                      <div className="class-meta">
                        <p>{classPlan.subject} · Grade {classPlan.grade}</p>
                        <p>{classPlan.chapter_name}</p>
                        <p>{classPlan.total_duration_minutes} minutes</p>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-primary btn-with-icon${isJoining ? ' is-loading' : ''}`}
                        disabled={joiningId !== null}
                        onClick={() => { void attendClass(generation.generation_id) }}
                      >
                        <Icon icon={LogIn} size={16} />
                        {isJoining ? 'Joining…' : 'Attend Class'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <StatusPanel
                tone="empty"
                title="Your classroom is waiting."
                description="Ask your teacher to publish and generate a class — then it will appear here, ready to attend."
              />
            )}
          </section>
        </>
      ) : null}
    </main>
  )
}
