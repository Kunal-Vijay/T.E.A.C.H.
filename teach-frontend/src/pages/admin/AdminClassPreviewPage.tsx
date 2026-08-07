import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import TeachLogo from '../../components/branding/TeachLogo'
import ClassroomLayout from '../../components/classroom/ClassroomLayout'
import { classPlanApi } from '../../services/api/classPlanApi'
import { classroomApi } from '../../services/api/classroomApi'
import { generationApi } from '../../services/api/generationApi'
import { quizApi } from '../../services/api/quizApi'
import { sageApi } from '../../services/api/sageApi'
import type { CurrentStateResponse } from '../../types/api.types'

export default function AdminClassPreviewPage() {
  const { planId = '' } = useParams()
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<CurrentStateResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshCurrentState = useCallback(async (activeSessionId: string) => {
    const response = await classroomApi.getCurrent(activeSessionId)
    setCurrentState(response.data)
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        const planResponse = await classPlanApi.get(planId)
        if (planResponse.data.latest_generation === null) {
          setErrorMessage('No generated class content available to preview')
          return
        }
        const generationResponse = await generationApi.getStatus(planResponse.data.latest_generation.generation_id)
        if (
          generationResponse.data.status !== 'completed'
          && generationResponse.data.status !== 'completed_with_warnings'
        ) {
          setErrorMessage('Class content is not ready for preview yet')
          return
        }
        const activeGenerationId = generationResponse.data.generation_id
        setGenerationId(activeGenerationId)
        const sessionResponse = await classroomApi.create(activeGenerationId, 'admin-preview')
        setSessionId(sessionResponse.data.session_id)
        await refreshCurrentState(sessionResponse.data.session_id)
      } catch {
        setErrorMessage('Failed to load class preview')
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [planId, refreshCurrentState])

  if (loading) {
    return <div className="page container page-main">Loading preview...</div>
  }

  if (errorMessage !== null) {
    return (
      <div className="page">
        <header className="container page-header">
          <TeachLogo />
          <Link to={`/teacher/classes/${planId}/review`} className="btn btn-secondary">Back to Review</Link>
        </header>
        <main className="container page-main error-banner">{errorMessage}</main>
      </div>
    )
  }

  if (currentState === null || sessionId === null || generationId === null) {
    return <div className="page container page-main">Preview unavailable</div>
  }

  return (
    <div className="page">
      <header className="container page-header">
        <div className="preview-header-copy">
          <TeachLogo />
          <span className="preview-badge">Admin Preview</span>
        </div>
        <Link to={`/teacher/classes/${planId}/review`} className="btn btn-secondary">Back to Review</Link>
      </header>
      <main className="container page-main">
        <ClassroomLayout
          currentState={currentState}
          sessionStep={1}
          onAdvance={async () => {
            const response = await classroomApi.advance(sessionId)
            setCurrentState(response.data)
          }}
          onSubmitPrediction={async (predictionText) => {
            const response = await classroomApi.submitPrediction(sessionId, predictionText)
            setCurrentState(response.data)
          }}
          onQuizSubmit={async (questionId, selectedOptionId) => {
            const response = await quizApi.submitAttempt(sessionId, questionId, selectedOptionId)
            return response.data
          }}
          onOpenSage={async () => {
            const response = await sageApi.createSession(sessionId)
            return response.data.doubt_session_id
          }}
          onAskSage={async (doubtSessionId, message) => {
            const response = await sageApi.ask(doubtSessionId, message)
            return response.data
          }}
          onCloseSage={async (doubtSessionId) => {
            const response = await sageApi.close(doubtSessionId)
            setCurrentState(response.data)
          }}
          onSkipDoubts={async () => {
            const response = await classroomApi.skipDoubts(sessionId)
            setCurrentState(response.data)
          }}
        />
      </main>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; gap: 1rem; flex-wrap: wrap; }
        .preview-header-copy { display: flex; align-items: center; gap: 0.75rem; }
        .preview-badge { background: #dbeafe; color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; }
        .page-main { padding-bottom: 2rem; }
      `}</style>
    </div>
  )
}
