/**
 * Premium AI Oral Examination Experience
 *
 * A voice-first interface inspired by Duolingo Max, OpenAI Voice, and Khanmigo.
 * Three phases: Active Viva → Grading → Report.
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { captureException } from '../../../lib/monitoring'
import { resolveDisplayedError } from '../../../services/api/apiError'
import { learningSessionApi } from '../../../services/api/learningSessionApi'
import { useVivaVoiceSession } from '../../../hooks/useVivaVoiceSession'
import type { LearningSessionResponse } from '../../../types/learning.types'
import VivaActiveSession from './VivaActiveSession'
import VivaGradingScreen from './VivaGradingScreen'
import VivaReport from './VivaReport'
import './viva-experience.css'

export default function VivaExperience() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState<LearningSessionResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null)

  const hook = useVivaVoiceSession(sessionId)
  const {
    status,
    isLive,
    isGrading,
    errorMessage,
    assessment,
    assessmentError,
    setAssessment,
    start,
  } = hook

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [sessionRes, healthRes] = await Promise.all([
          learningSessionApi.get(sessionId),
          learningSessionApi.voiceHealth(),
        ])
        if (cancelled) return
        setSession(sessionRes.data)
        setVoiceAvailable(healthRes.data.voice_viva_available)

        if (
          sessionRes.data.viva_assessment !== null &&
          sessionRes.data.goal_status === 'completed'
        ) {
          try {
            const stored = await learningSessionApi.voiceVivaAssessment(sessionId)
            if (!cancelled) setAssessment(stored.data)
          } catch {
            // older text-mode viva, no rubric
          }
        }
      } catch (error) {
        if (cancelled) return
        captureException(error, { page: 'viva_experience' })
        const msg = resolveDisplayedError(
          error,
          { component: 'VivaExperience', action: 'load' },
          'Failed to load the viva',
        )
        if (msg) setLoadError(msg)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [sessionId, setAssessment])

  const handleExit = useCallback(() => {
    if (isLive) void hook.stop()
    navigate('/student')
  }, [hook, isLive, navigate])

  const handleStart = useCallback(async () => {
    await start()
  }, [start])

  const handleRetry = useCallback(() => {
    navigate('/student')
  }, [navigate])

  // Phase detection
  const showReport = assessment !== null && !isLive && !isGrading
  const showGrading = isGrading || (status === 'ended' && !assessment && !assessmentError)

  // Loading state
  if (!session && !loadError) {
    return (
      <div className="viva-exp-loading">
        <div className="viva-exp-loading-pulse" />
        <p>Preparing your examination…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="viva-exp-error">
        <p>{loadError}</p>
        <button className="viva-exp-btn" onClick={() => navigate('/student')}>
          Go back
        </button>
      </div>
    )
  }

  // Report phase
  if (showReport && assessment) {
    return (
      <VivaReport
        assessment={assessment}
        transcript={hook.transcript}
        onRetry={handleRetry}
        onExit={handleExit}
      />
    )
  }

  // Grading phase
  if (showGrading) {
    return <VivaGradingScreen questionsAnswered={hook.progress.questionsAnswered} />
  }

  // Active session / idle
  return (
    <VivaActiveSession
      hook={hook}
      voiceAvailable={voiceAvailable}
      errorMessage={errorMessage}
      onStart={handleStart}
      onExit={handleExit}
    />
  )
}
