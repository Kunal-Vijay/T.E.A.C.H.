import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import TeacherClassCard from '../../components/admin/TeacherClassCard'
import StatusPanel from '../../components/status/StatusPanel'
import {
  AppPage,
  ButtonLink,
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
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { classPlanApi } from '../../services/api/classPlanApi'
import type { ClassPlanResponse } from '../../types/api.types'

function prefetchClassDetailRoute(): void {
  void import('./ClassDetailPage')
}

const TEACHER_STEPS = [
  {
    title: 'Create a class plan',
    detail: 'Add subject, topics, and teaching notes for the lesson.',
  },
  {
    title: 'Publish it',
    detail: 'Lock the plan so T.E.A.C.H can turn it into a live class.',
  },
  {
    title: 'Generate the lesson',
    detail: 'Build slides, quizzes, and the AI teacher workflow students will attend.',
  },
]

export default function AdminClassListPage() {
  const navigate = useNavigate()
  const [classPlans, setClassPlans] = useState<ClassPlanResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadClassPlans = async () => {
      setErrorMessage(null)
      try {
        const response = await classPlanApi.list()
        if (!cancelled) {
          setClassPlans(response.data.items)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'admin_class_list' })
        const message = resolveDisplayedError(error, {
          component: 'AdminClassListPage',
          action: 'load_class_plans',
        }, 'Could not load classes.')
        if (message !== null) {
          setErrorMessage(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadClassPlans()
    return () => {
      cancelled = true
    }
  }, [])

  const showOnboarding = !loading && classPlans.length === 0 && errorMessage === null

  return (
    <AppPage variant="teacher-wide">
      {errorMessage !== null ? (
        <PageAlert>
          <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </PageAlert>
      ) : null}

      {loading ? (
        <div className="dashboard-loading">
          <DashboardHeroSkeleton showStats={false} />
          <ClassCardSkeleton count={4} variant="teacher" />
        </div>
      ) : null}

      {showOnboarding ? (
        <div className="dashboard-onboarding-wrap">
          <OnboardingPanel
            heading="Welcome to T.E.A.C.H"
            subtitle="Three steps from blank page to a student-ready lesson."
            steps={TEACHER_STEPS}
            ctaLabel="Create Class"
            onCta={() => navigate('/teacher/classes/new')}
          />
        </div>
      ) : null}

      {!loading && !showOnboarding ? (
        <>
          <HubHero>
            <PageHeader
              variant="hub"
              kicker="Teacher hub"
              title="Your classes"
              lede="Plan, publish, and generate lessons students can attend live."
              action={(
                <ButtonLink
                  variant="primary"
                  pill
                  icon={Plus}
                  withIcon
                  to="/teacher/classes/new"
                >
                  Create Class
                </ButtonLink>
              )}
            />
          </HubHero>

          <PageSection label="Your class plans">
            {classPlans.length > 0 ? (
              <>
                <CatalogToolbar
                  count={classPlans.length}
                  singularLabel=" class in your library"
                  pluralLabel=" classes in your library"
                />
                <CardGrid>
                  {classPlans.map((classPlan) => (
                    <TeacherClassCard
                      key={classPlan.plan_id}
                      planId={classPlan.plan_id}
                      title={classPlan.title}
                      subject={classPlan.subject}
                      grade={classPlan.grade}
                      chapterName={classPlan.chapter_name}
                      durationMinutes={classPlan.total_duration_minutes}
                      status={classPlan.status}
                      onPrefetch={prefetchClassDetailRoute}
                    />
                  ))}
                </CardGrid>
              </>
            ) : (
              <StatusPanel
                tone="empty"
                title="No classes yet."
                description="Create your first class plan to get started."
                action={(
                  <ButtonLink
                    variant="primary"
                    pill
                    icon={Plus}
                    withIcon
                    to="/teacher/classes/new"
                  >
                    Create Class
                  </ButtonLink>
                )}
              />
            )}
          </PageSection>
        </>
      ) : null}
    </AppPage>
  )
}
