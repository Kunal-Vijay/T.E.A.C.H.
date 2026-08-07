import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import TeacherHubBackLink from '../../components/nav/TeacherHubBackLink'
import StatusPanel from '../../components/status/StatusPanel'
import {
  ActionGroup,
  AppPage,
  Button,
  ButtonLink,
  ErrorState,
  GlassPanel,
  HubHero,
  LoadingSpinner,
  PageAlert,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { captureException } from '../../lib/monitoring'
import { logDisplayedError, resolveDisplayedError } from '../../services/api/apiError'
import { classPlanApi } from '../../services/api/classPlanApi'
import { generationApi } from '../../services/api/generationApi'
import type { ClassPlanDetailResponse, GenerationStatusResponse } from '../../types/api.types'

export default function ClassDetailPage() {
  const { planId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [classPlan, setClassPlan] = useState<ClassPlanDetailResponse | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const loadPlan = useCallback(async () => {
    const response = await classPlanApi.get(planId)
    setClassPlan(response.data)
    if (response.data.latest_generation != null) {
      const statusResponse = await generationApi.getStatus(response.data.latest_generation.generation_id)
      setGenerationStatus(statusResponse.data)
      return
    }
    setGenerationStatus(null)
  }, [planId])

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      setErrorMessage(null)
      try {
        await loadPlan()
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { action: 'load_class_plan', planId })
        const message = resolveDisplayedError(error, {
          component: 'ClassDetailPage',
          action: 'load_class_plan',
          planId,
        }, 'Failed to load class plan')
        if (message !== null) {
          setErrorMessage(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initialize()
    return () => {
      cancelled = true
    }
  }, [loadPlan, planId])

  useEffect(() => {
    const state = location.state as { created?: boolean } | null
    if (state?.created === true) {
      pushToast('Draft saved. Publish when you are ready.', 'success')
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, pushToast])

  useEffect(() => {
    if (generationStatus === null) {
      return undefined
    }
    if (
      generationStatus.status === 'completed'
      || generationStatus.status === 'completed_with_warnings'
      || generationStatus.status === 'failed'
    ) {
      return undefined
    }

    const generationId = generationStatus.generation_id
    let cancelled = false

    const pollStatus = async () => {
      try {
        const statusResponse = await generationApi.getStatus(generationId)
        if (!cancelled) {
          setGenerationStatus(statusResponse.data)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        logDisplayedError(error, {
          component: 'ClassDetailPage',
          action: 'poll_generation_status',
          generationId,
        })
      }
    }

    const intervalId = window.setInterval(() => {
      void pollStatus()
    }, 3000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [generationStatus?.generation_id, generationStatus?.status])

  const publishPlan = async () => {
    setErrorMessage(null)
    setIsPublishing(true)
    try {
      await classPlanApi.publish(planId)
      await loadPlan()
      pushToast('Class published. Generate the lesson next.', 'success')
    } catch (error) {
      captureException(error, { action: 'publish_class_plan', planId })
      const message = resolveDisplayedError(error, {
        component: 'ClassDetailPage',
        action: 'publish_class_plan',
        planId,
      }, 'Failed to publish class plan')
      if (message !== null) {
        setErrorMessage(message)
        pushToast(message, 'error')
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const generateClass = async () => {
    setErrorMessage(null)
    setIsGenerating(true)
    try {
      const response = await generationApi.trigger(planId)
      const statusResponse = await generationApi.getStatus(response.data.generation_id)
      setGenerationStatus(statusResponse.data)
      pushToast('Generation started. This may take a few minutes.', 'info')
      try {
        await loadPlan()
      } catch {
        return
      }
    } catch (error) {
      captureException(error, { action: 'trigger_generation', planId })
      const message = resolveDisplayedError(error, {
        component: 'ClassDetailPage',
        action: 'trigger_generation',
        planId,
      }, 'Failed to trigger generation')
      if (message !== null) {
        setErrorMessage(message)
        pushToast(message, 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <AppPage variant="teacher-detail">
        <TeacherHubBackLink />
        <StatusPanel
          tone="loading"
          title="Preparing your classroom..."
          description="Loading this class plan and generation status."
        />
      </AppPage>
    )
  }

  if (classPlan === null) {
    return (
      <AppPage variant="teacher-detail">
        <TeacherHubBackLink />
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : (
          <StatusPanel
            tone="missing"
            title="We couldn't find that class."
            description="It may have been removed, or the link is out of date."
            action={(
              <ButtonLink variant="secondary" pill to="/teacher/classes">
                Back to Classes
              </ButtonLink>
            )}
          />
        )}
      </AppPage>
    )
  }

  const resolvedGenerationStatus = generationStatus?.status ?? classPlan.latest_generation?.status ?? null
  const isGenerationComplete =
    resolvedGenerationStatus === 'completed' || resolvedGenerationStatus === 'completed_with_warnings'
  const isGenerationInProgress =
    resolvedGenerationStatus === 'pending'
    || resolvedGenerationStatus === 'generating_content'
    || resolvedGenerationStatus === 'generating_images'
  const showGenerateButton =
    classPlan.status === 'published'
    && !isGenerationComplete
    && !isGenerationInProgress
    && !isGenerating

  const isGeneratingActive = isGenerating || isGenerationInProgress
  const showGenerateAction =
    classPlan.status === 'published'
    && !isGenerationComplete
    && (showGenerateButton || isGeneratingActive)

  const detailActions = (
    <ActionGroup>
      {isGenerationComplete ? (
        <ButtonLink variant="secondary" pill to={`/teacher/classes/${planId}/review`}>
          Review &amp; Regenerate
        </ButtonLink>
      ) : null}
      {classPlan.status === 'draft' ? (
        <Button
          variant="primary"
          pill
          loading={isPublishing}
          disabled={isPublishing}
          onClick={() => { void publishPlan() }}
        >
          {isPublishing ? 'Publishing…' : 'Publish'}
        </Button>
      ) : null}
      {showGenerateAction ? (
        <Button
          variant="primary"
          pill
          withIcon={isGeneratingActive}
          className="teacher-class-detail-generate-btn"
          disabled={isGeneratingActive}
          aria-busy={isGeneratingActive || undefined}
          onClick={() => { void generateClass() }}
        >
          {isGeneratingActive ? (
            <>
              <LoadingSpinner size={16} label="Generating class" />
              Generating...
            </>
          ) : (
            resolvedGenerationStatus === 'failed' ? 'Retry Generate' : 'Generate Class'
          )}
        </Button>
      ) : null}
    </ActionGroup>
  )

  return (
    <AppPage variant="teacher-detail">
      {errorMessage !== null ? (
        <PageAlert>
          <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </PageAlert>
      ) : null}

      <TeacherHubBackLink />

      <HubHero className="teacher-class-detail-hero">
        <div className="teacher-class-detail-badges">
          <StatusBadge variant="hub" status={classPlan.status} />
          {isGenerationComplete ? <StatusBadge variant="hub" status="ready" /> : null}
        </div>
        <PageHeader
          variant="hub"
          kicker="Class plan"
          title={classPlan.title}
          lede={`${classPlan.subject} · ${classPlan.chapter_name} · ${classPlan.total_duration_minutes} min`}
          action={detailActions}
        />
      </HubHero>

      <GlassPanel className="teacher-class-detail-body" aria-label="Class plan details">
        {generationStatus !== null ? (
          isGenerationComplete ? (
            <StatusPanel
              tone="success"
              compact
              title="Class is ready."
              description={`Slides: ${generationStatus.progress.slides_generated} · Images: ${generationStatus.progress.images_completed}/${generationStatus.progress.images_total}. Use Review & Regenerate to preview or create a new version.`}
            />
          ) : isGenerationInProgress || isGenerating ? (
            <StatusPanel
              tone="loading"
              compact
              title="Building your lesson..."
              description={`${generationStatus.status.replace(/_/g, ' ')} · Slides: ${generationStatus.progress.slides_generated} · Images: ${generationStatus.progress.images_completed}/${generationStatus.progress.images_total}`}
            />
          ) : generationStatus.status === 'failed' ? (
            <StatusPanel
              tone="missing"
              compact
              title="Generation hit a snag."
              description={generationStatus.error_message ?? 'Try Retry Generate to build the lesson again.'}
            />
          ) : (
            <div className="teacher-class-detail-generation-status">
              <strong>Generation:</strong> {generationStatus.status.replace(/_/g, ' ')}
              <span>Slides: {generationStatus.progress.slides_generated}</span>
              <span>Images: {generationStatus.progress.images_completed}/{generationStatus.progress.images_total}</span>
            </div>
          )
        ) : classPlan.status === 'published' ? (
          <StatusPanel
            tone="empty"
            compact
            title="Your classroom is waiting."
            description="Click Generate Class to create slides, quizzes, and the AI teacher workflow."
          />
        ) : null}

        <div className="teacher-class-detail-topics">
          <SectionTitle>Lesson topics</SectionTitle>
          <ul className="teacher-class-detail-topics-list">
            {classPlan.topics.map((topic) => (
              <li className="teacher-class-detail-topic" key={topic.topic_id}>
                <h3>{topic.order}. {topic.title}</h3>
                <p>{topic.duration_minutes} min</p>
              </li>
            ))}
          </ul>
        </div>
      </GlassPanel>
    </AppPage>
  )
}
