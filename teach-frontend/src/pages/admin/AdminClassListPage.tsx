import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import PageHeader from '../../components/ui/PageHeader'
import SkeletonCardGrid from '../../components/ui/SkeletonCardGrid'
import StatusPanel from '../../components/status/StatusPanel'
import ErrorState from '../../components/ui/ErrorState'
import Icon from '../../components/ui/Icon'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { classPlanApi } from '../../services/api/classPlanApi'
import type { ClassPlanResponse } from '../../types/api.types'

const TEACHER_STEPS = [
  {
    title: 'Create a class plan',
    detail: 'Add subject, topics, and teaching notes for the lesson.',
  },
  {
    title: 'Publish it',
    detail: 'Lock the plan so TEACH can turn it into a live class.',
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
    <main className="container page-main">
      {!showOnboarding && !loading ? (
        <PageHeader
          kicker="Teacher"
          title="Your classes"
          lede="Plan, publish, and generate lessons students can attend live."
          action={(
            <Link className="btn btn-primary btn-with-icon" to="/teacher/classes/new">
              <Icon icon={Plus} size={16} />
              Create Class
            </Link>
          )}
        />
      ) : null}

      {loading ? (
        <>
          <PageHeader
            kicker="Teacher"
            title="Your classes"
            lede="Plan, publish, and generate lessons students can attend live."
          />
          <SkeletonCardGrid count={4} />
        </>
      ) : null}

      {errorMessage !== null ? <ErrorState message={errorMessage} /> : null}

      {showOnboarding ? (
        <OnboardingPanel
          heading="Welcome to TEACH"
          subtitle="Three steps from blank page to a student-ready lesson."
          steps={TEACHER_STEPS}
          ctaLabel="Create Class"
          onCta={() => navigate('/teacher/classes/new')}
        />
      ) : null}

      {!loading && classPlans.length > 0 ? (
        <div className="grid-cards">
          {classPlans.map((classPlan) => (
            <Link key={classPlan.plan_id} to={`/teacher/classes/${classPlan.plan_id}`} className="card class-card card-interactive">
              <span className={`badge badge-${classPlan.status}`}>{classPlan.status}</span>
              <h3>{classPlan.title}</h3>
              <div className="class-meta">
                <p>{classPlan.subject} · Grade {classPlan.grade}</p>
                <p>{classPlan.chapter_name}</p>
                <p>{classPlan.total_duration_minutes} minutes</p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {!loading && !showOnboarding && classPlans.length === 0 && errorMessage === null ? (
        <StatusPanel
          tone="empty"
          title="No classes yet."
          description="Create your first class plan to get started."
          action={(
            <Link className="btn btn-primary btn-with-icon" to="/teacher/classes/new">
              <Icon icon={Plus} size={16} />
              Create Class
            </Link>
          )}
        />
      ) : null}
    </main>
  )
}
