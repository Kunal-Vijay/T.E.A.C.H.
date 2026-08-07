import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppPage,
  Button,
  ButtonLink,
  CardGrid,
  ClassCardSkeleton,
  ErrorState,
  PageAlert,
  PageHeader,
  PageSection,
} from '../../components/ui'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { topicApi } from '../../services/api/topicApi'
import type { TopicResponse } from '../../types/learning.types'

export default function AdminTopicListPage() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<TopicResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await topicApi.list()
        if (!cancelled) {
          setTopics(response.data.items)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'admin_topic_list' })
        const message = resolveDisplayedError(
          error,
          { component: 'AdminTopicListPage', action: 'load' },
          'Could not load topics.',
        )
        if (message !== null) {
          setErrorMessage(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const publishTopic = async (topicId: string) => {
    try {
      const response = await topicApi.publish(topicId)
      setTopics((current) =>
        current.map((topic) => (topic.id === topicId ? response.data : topic)),
      )
    } catch (error) {
      captureException(error, { page: 'admin_topic_list', action: 'publish' })
      const message = resolveDisplayedError(
        error,
        { component: 'AdminTopicListPage', action: 'publish' },
        'Could not publish topic.',
      )
      if (message !== null) {
        setErrorMessage(message)
      }
    }
  }

  return (
    <AppPage>
      <PageHeader
        kicker="Teacher workspace"
        title="Topics"
        lede="Create a topic and table of contents. Students pick a mode after publish — no offline generation."
        action={
          <ButtonLink to="/teacher/topics/new" icon={Plus}>
            New topic
          </ButtonLink>
        }
      />
      <PageSection label="Topics">
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        {loading ? (
          <CardGrid>
            <ClassCardSkeleton />
          </CardGrid>
        ) : null}
        {!loading && topics.length === 0 ? (
          <ErrorState message="No topics yet. Create your first topic with a TOC." />
        ) : null}
        {!loading && topics.length > 0 ? (
          <CardGrid>
            {topics.map((topic) => (
              <article key={topic.id} className="class-catalog-card">
                <span className="class-catalog-card-subject">{topic.subject}</span>
                <strong className="class-catalog-card-title">{topic.title}</strong>
                <p className="class-catalog-card-meta">
                  {topic.status} · {topic.toc_items.length} TOC items
                </p>
                <div className="session-composer-actions">
                  <Button type="button" variant="secondary" onClick={() => navigate(`/teacher/topics/${topic.id}`)}>
                    Open
                  </Button>
                  {topic.status === 'draft' ? (
                    <Button type="button" onClick={() => void publishTopic(topic.id)}>
                      Publish
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </CardGrid>
        ) : null}
      </PageSection>
    </AppPage>
  )
}
