import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import ClassCatalogCard from '../../components/catalog/ClassCatalogCard'
import LearningStatsBar from '../../components/delight/LearningStatsBar'
import StatusPanel from '../../components/status/StatusPanel'
import {
  AppPage,
  CardGrid,
  CatalogToolbar,
  ClassCardSkeleton,
  DashboardHeroSkeleton,
  ErrorState,
  HubHero,
  PageAlert,
  PageHeader,
  PageSection,
} from '../../components/ui'
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
  { title: 'Join your class', detail: 'Pick a ready lesson from your catalog.' },
  { title: 'Attend the lesson', detail: 'Learn with your AI Tutor — voice, slides, and quizzes.' },
  { title: 'Ask SAGE anything', detail: 'Pause anytime to resolve doubts before moving on.' },
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
    <AppPage variant="student">
      {errorMessage !== null ? (
        <PageAlert>
          <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </PageAlert>
      ) : null}

      {loading ? (
        <div className="dashboard-loading">
          <DashboardHeroSkeleton />
          <ClassCardSkeleton count={6} />
        </div>
      ) : null}

      {!loading && showOnboarding ? (
        <div className="dashboard-onboarding-wrap">
          <OnboardingPanel
            heading="Welcome to T.E.A.C.H"
            subtitle="Your AI classroom is ready. Here is how learning works."
            steps={STUDENT_STEPS}
            ctaLabel="Browse classes"
            onCta={browseClasses}
            footnote={
              availableClasses.length === 0
                ? 'No classes are ready yet. Ask your teacher to publish a class and generate it.'
                : undefined
            }
          />
        </div>
      ) : null}

      {!loading && !showOnboarding ? (
        <>
          <HubHero>
            <PageHeader
              variant="hub"
              kicker={mentor !== null ? `Learning with ${mentor.name}` : 'Student hub'}
              title="Your classes"
              lede={dailyGoalLede(progress.lessonsCompletedToday, progress.dailyGoal, progress.streak)}
            />
            <LearningStatsBar />
          </HubHero>

          <PageSection label="Class catalog" catalog>
            {availableClasses.length > 0 ? (
              <>
                <CatalogToolbar
                  count={availableClasses.length}
                  singularLabel=" class ready to attend"
                  pluralLabel=" classes ready to attend"
                />
                <CardGrid>
                  {availableClasses.map(({ classPlan, generation }) => {
                    const isJoining = joiningId === generation.generation_id
                    return (
                      <ClassCatalogCard
                        key={generation.generation_id}
                        title={classPlan.title}
                        subject={classPlan.subject}
                        grade={classPlan.grade}
                        chapterName={classPlan.chapter_name}
                        durationMinutes={classPlan.total_duration_minutes}
                        isJoining={isJoining}
                        joinDisabled={joiningId !== null}
                        onJoin={() => { void attendClass(generation.generation_id) }}
                        onPrefetch={prefetchClassroomRoute}
                      />
                    )
                  })}
                </CardGrid>
              </>
            ) : (
              <StatusPanel
                tone="empty"
                title="Your classroom is waiting."
                description="Ask your teacher to publish and generate a class — then it will appear here, ready to attend."
              />
            )}
          </PageSection>
        </>
      ) : null}
    </AppPage>
  )
}
