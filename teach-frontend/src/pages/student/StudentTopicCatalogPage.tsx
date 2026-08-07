import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopicCatalogCard from '../../components/catalog/TopicCatalogCard'
import TopicSessionModal from '../../components/student/TopicSessionModal'
import OnboardingPanel from '../../components/onboarding/OnboardingPanel'
import StatusPanel from '../../components/status/StatusPanel'
import { NovaTutor } from '../../components/nova'
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
import { useMentor } from '../../context/MentorContext'
import { useToast } from '../../context/ToastContext'
import {
  estimateTopicDurationMinutes,
  fetchAllPublishedTopics,
  formatRecordingDate,
  resolveRecordingStatus,
} from '../../lib/topicCatalog'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import {
  getAllTopicProgress,
  getTopicProgress,
  recordTopicOpened,
} from '../../services/topicProgress'
import { isStudentOnboarded, markStudentOnboarded } from '../../services/auth/authService'
import type { TopicResponse } from '../../types/learning.types'

const STUDENT_STEPS = [
  { title: 'Browse recordings', detail: 'Every AI-generated class Nova has taught appears in your library.' },
  { title: 'Open any class', detail: 'Pick a recording and revisit the full lesson on your schedule.' },
  { title: 'Watch again anytime', detail: 'Return to previous classes whenever you need a refresher.' },
]

export default function StudentTopicCatalogPage() {
  const navigate = useNavigate()
  const { topicId } = useParams()
  const { pushToast } = useToast()
  const { tutor } = useMentor()
  const [topics, setTopics] = useState<TopicResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(() => !isStudentOnboarded())
  const [progressVersion, setProgressVersion] = useState(0)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const modalOpen = topicId != null && topicId !== ''

  useEffect(() => {
    let cancelled = false
    const loadTopics = async () => {
      setErrorMessage(null)
      try {
        const items = await fetchAllPublishedTopics()
        if (!cancelled) {
          setTopics(items)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'student_topic_catalog' })
        const message = resolveDisplayedError(
          error,
          { component: 'StudentTopicCatalogPage', action: 'load_topics' },
          'Failed to load recorded classes',
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

  const topicProgressMap = useMemo(
    () => getAllTopicProgress(),
    [progressVersion, topics.length],
  )

  const openTopic = useCallback((topic: TopicResponse, trigger: HTMLElement | null) => {
    lastTriggerRef.current = trigger
    recordTopicOpened(topic.id, topic.toc_items.length)
    setProgressVersion((value) => value + 1)
    navigate(`/student/topics/${topic.id}`)
  }, [navigate])

  const closeModal = useCallback(() => {
    navigate('/student')
  }, [navigate])

  const browseClasses = () => {
    markStudentOnboarded()
    setShowOnboarding(false)
  }

  return (
    <AppPage variant="student" className="student-classes-page recorded-classes-page">
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
            subtitle="Your recorded class library is ready. Here is how it works."
            steps={STUDENT_STEPS}
            ctaLabel="Browse recordings"
            onCta={browseClasses}
          />
        </div>
      ) : null}

      {!loading && !showOnboarding ? (
        <>
          <HubHero>
            <PageHeader
              variant="hub"
              kicker="Nova's class archive"
              title="Recorded Classes"
              lede="Browse and revisit previously recorded AI classes taught by Nova."
            />
          </HubHero>

          <PageSection label="Recorded class library" catalog>
            {topics.length > 0 ? (
              <>
                <CatalogToolbar
                  count={topics.length}
                  singularLabel=" recorded class"
                  pluralLabel=" recorded classes"
                />
                <CardGrid className="student-classes-grid">
                  {topics.map((topic) => {
                    const stored = topicProgressMap[topic.id] ?? getTopicProgress(topic.id)
                    const progressPercent = stored?.progressPercent ?? 0
                    const firstLessonTitle = topic.toc_items[0]?.title

                    return (
                      <TopicCatalogCard
                        key={topic.id}
                        title={topic.title}
                        subject={topic.subject}
                        description={
                          topic.description !== ''
                            ? topic.description
                            : (firstLessonTitle ?? 'AI-generated class recording with Nova.')
                        }
                        topicCount={topic.toc_items.length}
                        recordingDateLabel={formatRecordingDate(topic.updated_at ?? topic.created_at)}
                        durationMinutes={estimateTopicDurationMinutes(topic.toc_items.length)}
                        recordingStatus={resolveRecordingStatus(progressPercent)}
                        tutorName={tutor.name}
                        onOpen={(event) => openTopic(topic, event.currentTarget)}
                      />
                    )
                  })}
                </CardGrid>
              </>
            ) : (
              <div className="student-classes-empty">
                <NovaTutor size="md" label="" className="student-classes-empty-nova" />
                <StatusPanel
                  tone="empty"
                  title="No Recorded Classes"
                  description="Previously generated AI classes will appear here once they are available."
                />
              </div>
            )}
          </PageSection>
        </>
      ) : null}

      {modalOpen && topicId != null ? (
        <TopicSessionModal
          topicId={topicId}
          open={modalOpen}
          onClose={closeModal}
          returnFocusRef={lastTriggerRef}
        />
      ) : null}
    </AppPage>
  )
}
