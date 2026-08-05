import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TeachLogo from '../../components/branding/TeachLogo'
import ClassroomLayout from '../../components/classroom/ClassroomLayout'
import { classroomApi } from '../../services/api/classroomApi'
import { quizApi } from '../../services/api/quizApi'
import { sageApi } from '../../services/api/sageApi'
import type { CurrentStateResponse } from '../../types/api.types'

export default function ClassroomPage() {
  const { generationId = '' } = useParams()
  const [sessionId, setSessionId] = useState<string | null>(sessionStorage.getItem('classroomSessionId'))
  const [currentState, setCurrentState] = useState<CurrentStateResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshCurrentState = useCallback(async (activeSessionId: string) => {
    const response = await classroomApi.getCurrent(activeSessionId)
    setCurrentState(response.data)
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        let activeSessionId = sessionId
        if (activeSessionId === null || activeSessionId === '') {
          const response = await classroomApi.create(generationId, 'student')
          activeSessionId = response.data.session_id
          sessionStorage.setItem('classroomSessionId', activeSessionId)
          setSessionId(activeSessionId)
        }
        await refreshCurrentState(activeSessionId)
      } catch {
        setErrorMessage('Failed to load classroom session')
      }
    }
    initialize()
  }, [generationId, refreshCurrentState, sessionId])

  if (errorMessage !== null) {
    return <div className="page container page-main error-banner">{errorMessage}</div>
  }

  if (currentState === null || sessionId === null) {
    return <div className="page container page-main">Loading classroom...</div>
  }

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
      </header>
      <main className="container page-main">
        <ClassroomLayout
          currentState={currentState}
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
          onAskSage={async (message) => {
            const activeDoubtSessionId = (await sageApi.createSession(sessionId)).data.doubt_session_id
            const response = await sageApi.ask(activeDoubtSessionId, message)
            return response.data
          }}
          onCloseSage={async () => {
            const activeDoubtSessionId = (await sageApi.createSession(sessionId)).data.doubt_session_id
            const response = await sageApi.close(activeDoubtSessionId)
            setCurrentState(response.data)
          }}
          onSkipDoubts={async () => {
            const response = await classroomApi.skipDoubts(sessionId)
            setCurrentState(response.data)
          }}
        />
      </main>
      <style>{`
        .page-header { padding: 1rem 0; }
        .page-main { padding-bottom: 2rem; }
      `}</style>
    </div>
  )
}
