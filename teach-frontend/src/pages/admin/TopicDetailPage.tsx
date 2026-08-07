import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppPage, Button, ErrorState, PageAlert, PageHeader, PageSection } from '../../components/ui'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { topicApi } from '../../services/api/topicApi'
import type { TopicResponse } from '../../types/learning.types'

export default function TopicDetailPage() {
  const { topicId = '' } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await topicApi.get(topicId)
        if (!cancelled) {
          setTopic(response.data)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'topic_detail' })
        const message = resolveDisplayedError(
          error,
          { component: 'TopicDetailPage', action: 'load' },
          'Could not load topic.',
        )
        if (message !== null) {
          setErrorMessage(message)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [topicId])

  const publish = async () => {
    if (topic == null) {
      return
    }
    try {
      const response = await topicApi.publish(topic.id)
      setTopic(response.data)
    } catch (error) {
      captureException(error, { page: 'topic_detail', action: 'publish' })
      const message = resolveDisplayedError(
        error,
        { component: 'TopicDetailPage', action: 'publish' },
        'Could not publish topic.',
      )
      if (message !== null) {
        setErrorMessage(message)
      }
    }
  }

  if (topic == null) {
    return (
      <AppPage>
        <PageSection label="Loading topic">{errorMessage ?? 'Loading…'}</PageSection>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <PageHeader title={topic.title} lede={`${topic.subject} · ${topic.status}`} />
      <PageSection label="Topic details">
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        <p>{topic.description}</p>
        <h2>Table of contents</h2>
        <ol>
          {topic.toc_items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong> — {item.summary}
            </li>
          ))}
        </ol>
        <div className="session-composer-actions">
          {topic.status === 'draft' ? (
            <Button type="button" onClick={() => void publish()}>
              Publish for students
            </Button>
          ) : (
            <p>Published. Students can start teach / doubt / pop quiz / viva sessions.</p>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/topics')}>
            Back to topics
          </Button>
        </div>
      </PageSection>
    </AppPage>
  )
}
