import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import { generationApi } from '../../services/api/generationApi'
import type { ClassPlanDetailResponse, GenerationStatusResponse } from '../../types/api.types'

export default function ReviewClassPage() {
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const [classPlan, setClassPlan] = useState<ClassPlanDetailResponse | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusResponse | null>(null)
  const [generationHistory, setGenerationHistory] = useState<GenerationStatusResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const loadReviewData = useCallback(async () => {
    const planResponse = await classPlanApi.get(planId)
    setClassPlan(planResponse.data)
    if (planResponse.data.latest_generation !== null) {
      const statusResponse = await generationApi.getStatus(planResponse.data.latest_generation.generation_id)
      setGenerationStatus(statusResponse.data)
    } else {
      setGenerationStatus(null)
    }
    const historyResponse = await generationApi.listByPlan(planId, { page: 1, limit: 10 })
    setGenerationHistory(historyResponse.data.items)
  }, [planId])

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadReviewData()
      } catch {
        setErrorMessage('Failed to load class review')
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [loadReviewData])

  const publishPlan = async () => {
    setIsPublishing(true)
    setErrorMessage(null)
    try {
      await classPlanApi.publish(planId)
      await loadReviewData()
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setErrorMessage(error.response.data.detail)
        return
      }
      setErrorMessage('Failed to publish class plan')
    } finally {
      setIsPublishing(false)
    }
  }

  const regenerateClass = async () => {
    const confirmed = window.confirm(
      'Start a new generation? Students will see the latest completed version once it finishes.',
    )
    if (!confirmed) {
      return
    }
    setIsRegenerating(true)
    setErrorMessage(null)
    try {
      const response = await generationApi.trigger(planId)
      navigate(`/teacher/classes/${planId}`, { state: { generationId: response.data.generation_id } })
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setErrorMessage(error.response.data.detail)
        return
      }
      setErrorMessage('Failed to regenerate class')
    } finally {
      setIsRegenerating(false)
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
  const canPreview = isGenerationComplete
  const canRegenerate = classPlan.status === 'published' && !isGenerationInProgress && !isRegenerating

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
        <Link to={`/teacher/classes/${planId}`} className="btn btn-secondary">Back to Class</Link>
      </header>
      <main className="container page-main">
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}

        <section className="card review-card">
          <div className="review-header">
            <div>
              <span className={`badge badge-${classPlan.status}`}>{classPlan.status}</span>
              {isGenerationComplete ? <span className="badge badge-ready">ready</span> : null}
              <h2>{classPlan.title}</h2>
              <p>{classPlan.subject} • {classPlan.chapter_name} • {classPlan.total_duration_minutes} min</p>
            </div>
            <div className="review-actions">
              <Link to={`/teacher/classes/${planId}/edit`} className="btn btn-secondary">Edit Plan</Link>
              {canPreview ? (
                <Link to={`/teacher/classes/${planId}/preview`} className="btn btn-secondary">Preview Class</Link>
              ) : null}
              {classPlan.status === 'draft' ? (
                <button className="btn btn-primary" onClick={publishPlan} disabled={isPublishing}>
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </button>
              ) : null}
              {canRegenerate ? (
                <button className="btn btn-primary" onClick={regenerateClass} disabled={isRegenerating}>
                  {isRegenerating ? 'Starting...' : 'Regenerate Class'}
                </button>
              ) : null}
            </div>
          </div>

          {generationStatus !== null ? (
            <div className={`generation-status generation-status-${generationStatus.status}`}>
              <strong>Latest generation:</strong> {String(generationStatus.status).replace(/_/g, ' ')}
              <span>Slides: {generationStatus.progress.slides_generated}</span>
              <span>Images: {generationStatus.progress.images_completed}/{generationStatus.progress.images_total}</span>
            </div>
          ) : (
            <div className="generation-status generation-status-pending">
              <span>No class content generated yet.</span>
            </div>
          )}
        </section>

        <section className="card topics-review-card">
          <h3>Topics</h3>
          <div className="topics-review-list">
            {classPlan.topics.map((topic) => (
              <article className="topic-review-item" key={topic.topic_id}>
                <div className="topic-review-heading">
                  <h4>{topic.order}. {topic.title}</h4>
                  <span>{topic.duration_minutes} minutes</span>
                </div>
                <div className="topic-review-section">
                  <strong>Base Material</strong>
                  <p>{topic.base_material}</p>
                </div>
                {topic.teaching_guidelines.length > 0 ? (
                  <div className="topic-review-section">
                    <strong>Teaching Guidelines</strong>
                    <ul>
                      {topic.teaching_guidelines.map((guideline, guidelineIndex) => (
                        <li key={`${topic.topic_id}-guideline-${guidelineIndex}`}>{guideline}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {topic.miscellaneous_notes.length > 0 ? (
                  <div className="topic-review-section">
                    <strong>Miscellaneous Notes</strong>
                    <ul>
                      {topic.miscellaneous_notes.map((note, noteIndex) => (
                        <li key={`${topic.topic_id}-note-${noteIndex}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {generationHistory.length > 0 ? (
          <section className="card history-card">
            <h3>Generation History</h3>
            <div className="history-list">
              {generationHistory.map((generation) => (
                <div className="history-item" key={generation.generation_id}>
                  <span className={`badge badge-${generation.status}`}>{String(generation.status).replace(/_/g, ' ')}</span>
                  <span>{generation.progress.slides_generated} slides</span>
                  <span>{generation.progress.images_completed}/{generation.progress.images_total} images</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .review-card, .topics-review-card, .history-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .review-header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .review-header .badge { margin-right: 0.5rem; }
        .review-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
        .generation-status { display: flex; gap: 1rem; flex-wrap: wrap; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 12px; align-items: center; }
        .generation-status-completed, .generation-status-completed_with_warnings { background: #ecfdf5; border: 1px solid #6ee7b7; }
        .topics-review-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .topic-review-item { padding: 1rem; border: 1px solid var(--teach-border); border-radius: 12px; display: flex; flex-direction: column; gap: 0.75rem; }
        .topic-review-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
        .topic-review-section p, .topic-review-section ul { margin: 0.35rem 0 0; color: var(--teach-muted, #64748b); }
        .topic-review-section ul { padding-left: 1.25rem; }
        .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .history-item { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--teach-border); border-radius: 12px; }
      `}</style>
    </div>
  )
}
