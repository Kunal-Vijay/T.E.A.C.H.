import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import { generationApi } from '../../services/api/generationApi'
import type { ClassPlanDetailResponse, GenerationStatusResponse } from '../../types/api.types'

export default function ClassDetailPage() {
  const { planId = '' } = useParams()
  const [classPlan, setClassPlan] = useState<ClassPlanDetailResponse | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

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
    const initialize = async () => {
      try {
        await loadPlan()
      } catch {
        setErrorMessage('Failed to load class plan')
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [loadPlan])

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
    const intervalId = window.setInterval(async () => {
      const statusResponse = await generationApi.getStatus(generationId)
      setGenerationStatus(statusResponse.data)
    }, 3000)
    return () => window.clearInterval(intervalId)
  }, [generationStatus?.generation_id, generationStatus?.status])

  const publishPlan = async () => {
    setErrorMessage(null)
    try {
      await classPlanApi.publish(planId)
      await loadPlan()
    } catch {
      setErrorMessage('Failed to publish class plan')
    }
  }

  const generateClass = async () => {
    setErrorMessage(null)
    setIsGenerating(true)
    try {
      const response = await generationApi.trigger(planId)
      const statusResponse = await generationApi.getStatus(response.data.generation_id)
      setGenerationStatus(statusResponse.data)
      try {
        await loadPlan()
      } catch {
        return
      }
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setErrorMessage(error.response.data.detail)
        return
      }
      setErrorMessage('Failed to trigger generation')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return <div className="page container page-main">Loading...</div>
  }

  if (classPlan === null) {
    return <div className="page container page-main">Class plan not found</div>
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

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
        <Link to="/admin/classes" className="btn btn-secondary">Back to Classes</Link>
      </header>
      <main className="container page-main">
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}
        <section className="card detail-card">
          <div className="detail-header">
            <div>
              <span className={`badge badge-${classPlan.status}`}>{classPlan.status}</span>
              {isGenerationComplete ? <span className="badge badge-ready">ready</span> : null}
              <h2>{classPlan.title}</h2>
              <p>{classPlan.subject} • {classPlan.chapter_name} • {classPlan.total_duration_minutes} min</p>
            </div>
            <div className="detail-actions">
              {isGenerationComplete ? (
                <Link to={`/admin/classes/${planId}/review`} className="btn btn-secondary">
                  Review &amp; Regenerate
                </Link>
              ) : null}
              {classPlan.status === 'draft' ? (
                <button className="btn btn-primary" onClick={publishPlan}>Publish</button>
              ) : null}
              {showGenerateButton ? (
                <button className="btn btn-primary" onClick={generateClass} disabled={isGenerating}>
                  {resolvedGenerationStatus === 'failed' ? 'Retry Generate' : 'Generate Class'}
                </button>
              ) : null}
              {isGenerating || isGenerationInProgress ? (
                <button className="btn btn-primary" disabled>
                  Generating...
                </button>
              ) : null}
            </div>
          </div>
          {generationStatus !== null ? (
            <div className={`generation-status generation-status-${generationStatus.status}`}>
              <strong>Generation:</strong> {String(generationStatus.status).replace(/_/g, ' ')}
              <span>Slides: {generationStatus.progress.slides_generated}</span>
              <span>Images: {generationStatus.progress.images_completed}/{generationStatus.progress.images_total}</span>
              {generationStatus.status === 'completed' || generationStatus.status === 'completed_with_warnings' ? (
                <span className="generation-ready">
                  Class is ready — use Review &amp; Regenerate to preview or create a new version.
                </span>
              ) : null}
              {generationStatus.status === 'failed' && generationStatus.error_message != null ? (
                <span className="generation-error">{generationStatus.error_message}</span>
              ) : null}
            </div>
          ) : classPlan.status === 'published' ? (
            <div className="generation-status generation-status-pending">
              <span>No class content generated yet. Click Generate Class to create slides and quizzes.</span>
            </div>
          ) : null}
          <div className="topics-list">
            {classPlan.topics.map((topic) => (
              <div className="topic-item" key={topic.topic_id}>
                <h3>{topic.order}. {topic.title}</h3>
                <p>{topic.duration_minutes} minutes</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; }
        .detail-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .detail-header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .detail-header .badge { margin-right: 0.5rem; }
        .detail-actions { display: flex; gap: 0.75rem; }
        .generation-status { display: flex; gap: 1rem; flex-wrap: wrap; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 12px; align-items: center; }
        .generation-status-completed, .generation-status-completed_with_warnings { background: #ecfdf5; border: 1px solid #6ee7b7; }
        .generation-status-failed { background: #fef2f2; border: 1px solid #fca5a5; }
        .generation-ready { color: #047857; font-weight: 600; }
        .generation-error { color: #b91c1c; }
        .topics-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .topic-item { padding: 0.75rem 1rem; border: 1px solid var(--teach-border); border-radius: 12px; }
      `}</style>
    </div>
  )
}
