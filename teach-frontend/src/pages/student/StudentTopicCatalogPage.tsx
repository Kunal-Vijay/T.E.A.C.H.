import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import {
  AppPage,
  CardGrid,
  ClassCardSkeleton,
  ErrorState,
  PageAlert,
  PageHeader,
  PageSection,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { topicApi } from '../../services/api/topicApi'
import { isStudentOnboarded, markStudentOnboarded } from '../../services/auth/authService'
import type { TopicResponse } from '../../types/learning.types'

const STUDENT_STEPS = [
  { title: 'Pick a topic', detail: 'Choose a published topic and browse its table of contents.' },
  { title: 'Choose a mode', detail: 'Teach, doubt, pop quiz, or viva — each has its own goal.' },
  { title: 'Learn by voice or chat', detail: 'Talk or type; slides and speech update live as you go.' },
]

export default function StudentTopicCatalogPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [topics, setTopics] = useState<TopicResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(() => !isStudentOnboarded())

  useEffect(() => {
    let cancelled = false
    const loadTopics = async () => {
      setErrorMessage(null)
      try {
        const response = await topicApi.list({ status: 'published' })
        if (!cancelled) {
          setTopics(response.data.items)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'student_topic_catalog' })
        const message = resolveDisplayedError(
          error,
          { component: 'StudentTopicCatalogPage', action: 'load_topics' },
          'Failed to load topics',
        )
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
    void loadTopics()
    return () => {
      cancelled = true
    }
  }, [pushToast])

  return (
    <AppPage>
      {showOnboarding ? (
        <OnboardingPanel
          steps={STUDENT_STEPS}
          ctaLabel="Start learning"
          onCta={() => {
            markStudentOnboarded()
            setShowOnboarding(false)
          }}
        />
      ) : null}
      <PageHeader
        kicker="Interactive tutor"
        title="Choose a topic to learn"
        lede="Pick a mode after you select a topic — teach, doubt, pop quiz, or viva."
      />
      <PageSection label="Published topics" catalog>
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        {loading ? (
          <CardGrid>
            <ClassCardSkeleton />
            <ClassCardSkeleton />
          </CardGrid>
        ) : null}
        {!loading && topics.length === 0 ? (
          <ErrorState message="No topics yet. Ask your teacher to publish a topic with a TOC." />
        ) : null}
        {!loading && topics.length > 0 ? (
          <CardGrid>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="class-catalog-card"
                onClick={() => navigate(`/student/topics/${topic.id}`)}
              >
                <span className="class-catalog-card-subject">{topic.subject}</span>
                <strong className="class-catalog-card-title">{topic.title}</strong>
                <p className="class-catalog-card-meta">{topic.toc_items.length} TOC items</p>
                <p className="class-catalog-card-meta">{topic.description}</p>
              </button>
            ))}
          </CardGrid>
        ) : null}
      </PageSection>
    </AppPage>
  )
}
