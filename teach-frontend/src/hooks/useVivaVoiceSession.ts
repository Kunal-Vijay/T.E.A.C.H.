import { useCallback, useEffect, useRef, useState } from 'react'
import {
  NovaAudioPlayer,
  NovaMicCapture,
  buildVivaVoiceSocketUrl,
  isVoiceCaptureSupported,
} from '../lib/voice/novaSonicAudio'
import type { VoiceVivaAssessment } from '../types/learning.types'

export type VivaVoiceStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'student_speaking'
  | 'examiner_speaking'
  | 'grading'
  | 'ended'
  | 'error'

export interface VivaTranscriptTurn {
  id: string
  role: 'USER' | 'ASSISTANT'
  text: string
  at: number
}

export interface VivaProgress {
  questionsAsked: number
  questionsAnswered: number
  secondsElapsed: number
  secondsRemaining: number
}

/** Why the viva ended on its own. */
export type VivaCompletionReason = 'question_limit' | 'time_limit' | 'other' | null

const DEFAULT_PROGRESS: VivaProgress = {
  questionsAsked: 0,
  questionsAnswered: 0,
  secondsElapsed: 0,
  secondsRemaining: 0,
}

/**
 * Drives one spoken viva over Nova Sonic.
 *
 * Owns the WebSocket to the relay, microphone capture at 16 kHz, and playback of
 * the examiner's 24 kHz audio. Question counting and the time limit are decided by
 * the server and arrive as `progress` / `complete` frames — this hook only reflects
 * them, so there is a single source of truth.
 */
export function useVivaVoiceSession(sessionId: string) {
  const [status, setStatus] = useState<VivaVoiceStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<VivaTranscriptTurn[]>([])
  const [micLevel, setMicLevel] = useState(0)
  const [progress, setProgress] = useState<VivaProgress>(DEFAULT_PROGRESS)
  const [completionReason, setCompletionReason] = useState<VivaCompletionReason>(null)
  const [assessment, setAssessment] = useState<VoiceVivaAssessment | null>(null)
  const [assessmentError, setAssessmentError] = useState<string | null>(null)
  const [maxQuestions, setMaxQuestions] = useState(10)
  const [maxSeconds, setMaxSeconds] = useState(120)
  const [topicTitle, setTopicTitle] = useState('')

  const socketRef = useRef<WebSocket | null>(null)
  const captureRef = useRef<NovaMicCapture | null>(null)
  const playerRef = useRef<NovaAudioPlayer | null>(null)
  const levelTimerRef = useRef<number | null>(null)
  const speakingTimerRef = useRef<number | null>(null)
  const stoppingRef = useRef(false)

  const teardown = useCallback(async () => {
    if (levelTimerRef.current !== null) {
      window.clearInterval(levelTimerRef.current)
      levelTimerRef.current = null
    }
    if (speakingTimerRef.current !== null) {
      window.clearInterval(speakingTimerRef.current)
      speakingTimerRef.current = null
    }
    if (captureRef.current !== null) {
      await captureRef.current.stop()
      captureRef.current = null
    }
    if (playerRef.current !== null) {
      await playerRef.current.close()
      playerRef.current = null
    }
    if (socketRef.current !== null) {
      const socket = socketRef.current
      socketRef.current = null
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'stop' }))
        } catch {
          // socket already going away
        }
      }
      socket.close()
    }
    setMicLevel(0)
  }, [])

  useEffect(() => {
    return () => {
      void teardown()
    }
  }, [teardown])

  const appendTranscript = useCallback((role: 'USER' | 'ASSISTANT', text: string) => {
    setTranscript((previous) => {
      const last = previous[previous.length - 1]
      // Nova Sonic emits partial fragments and sometimes repeats the same content
      // (SPECULATIVE then FINAL). The merge window below handles concatenation, but
      // we also need to skip outright duplicates so the UI never shows the same
      // sentence twice.
      if (last !== undefined && last.role === role && Date.now() - last.at < 8000) {
        // Skip if the new text is already contained in the previous entry, which
        // happens when Nova sends the same segment twice (speculative → final).
        if (last.text.includes(text) || text.includes(last.text)) {
          // Keep the longer of the two (final is usually ≥ speculative).
          if (text.length > last.text.length) {
            const merged = [...previous]
            merged[merged.length - 1] = { ...last, text, at: Date.now() }
            return merged
          }
          return previous
        }
        // Otherwise concatenate: two genuinely different fragments from the same turn.
        const merged = [...previous]
        merged[merged.length - 1] = { ...last, text: `${last.text} ${text}`.trim(), at: Date.now() }
        return merged
      }
      return [
        ...previous,
        { id: `${role}-${Date.now()}-${previous.length}`, role, text, at: Date.now() },
      ]
    })
  }, [])

  const start = useCallback(async () => {
    if (!isVoiceCaptureSupported()) {
      setStatus('error')
      setErrorMessage(
        'This browser cannot capture microphone audio. Try the latest Chrome, Edge or Safari.',
      )
      return
    }

    stoppingRef.current = false
    setStatus('connecting')
    setErrorMessage(null)
    setTranscript([])
    setProgress(DEFAULT_PROGRESS)
    setCompletionReason(null)
    setAssessment(null)
    setAssessmentError(null)

    const player = new NovaAudioPlayer()
    playerRef.current = player
    // Must happen inside the click handler's task for autoplay policies.
    await player.resume()

    const socket = new WebSocket(buildVivaVoiceSocketUrl(sessionId))
    socket.binaryType = 'arraybuffer'
    socketRef.current = socket

    const beginCapture = async () => {
      try {
        const capture = new NovaMicCapture()
        captureRef.current = capture
        await capture.start((chunk) => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(chunk)
          }
        })

        levelTimerRef.current = window.setInterval(() => {
          setMicLevel(capture.readLevel())
        }, 100)

        // Derive "examiner is talking" from whether audio is still queued.
        speakingTimerRef.current = window.setInterval(() => {
          const speaking = playerRef.current?.isSpeaking ?? false
          setStatus((current) => {
            if (current === 'student_speaking' || current === 'ended' || current === 'error') {
              return current
            }
            if (speaking) {
              return 'examiner_speaking'
            }
            return current === 'examiner_speaking' ? 'listening' : current
          })
        }, 200)
      } catch (error) {
        const denied =
          error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'SecurityError')
        setErrorMessage(
          denied
            ? 'Microphone access was blocked. Allow it in your browser settings and try again.'
            : `Could not start the microphone: ${String(error)}`,
        )
        setStatus('error')
      }
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      let message: Record<string, unknown>
      try {
        message = JSON.parse(event.data) as Record<string, unknown>
      } catch {
        return
      }

      switch (message.type) {
        case 'ready': {
          const limitQuestions = Number(message.max_questions ?? 10)
          const limitSeconds = Number(message.max_seconds ?? 120)
          setMaxQuestions(limitQuestions)
          setMaxSeconds(limitSeconds)
          setTopicTitle(String(message.topic_title ?? ''))
          setProgress({ ...DEFAULT_PROGRESS, secondsRemaining: limitSeconds })
          setStatus('listening')
          void beginCapture()
          break
        }
        case 'transcript': {
          const role = message.role === 'USER' ? 'USER' : 'ASSISTANT'
          const text = String(message.text ?? '').trim()
          if (text !== '') {
            appendTranscript(role, text)
          }
          break
        }
        case 'audio': {
          const data = message.data
          if (typeof data === 'string') {
            playerRef.current?.enqueueBase64(data)
          }
          break
        }
        case 'interrupted': {
          // Audio is produced faster than it plays, so there is a backlog queued
          // that must be dropped now or the examiner talks over the student.
          playerRef.current?.flush()
          setStatus('student_speaking')
          break
        }
        case 'speech': {
          if (message.state === 'start') {
            playerRef.current?.flush()
            setStatus('student_speaking')
          } else {
            setStatus((current) => (current === 'student_speaking' ? 'listening' : current))
          }
          break
        }
        case 'progress': {
          setProgress({
            questionsAsked: Number(message.questions_asked ?? 0),
            questionsAnswered: Number(message.questions_answered ?? 0),
            secondsElapsed: Number(message.seconds_elapsed ?? 0),
            secondsRemaining: Number(message.seconds_remaining ?? 0),
          })
          break
        }
        case 'grading': {
          // The server has closed the Nova Sonic stream and is now calling the
          // assessment model (5–30 seconds). Show a loader rather than silence.
          setProgress((current) => ({
            ...current,
            questionsAsked: Number(message.questions_asked ?? current.questionsAsked),
            questionsAnswered: Number(message.questions_answered ?? current.questionsAnswered),
            secondsRemaining: 0,
          }))
          setStatus('grading')
          void teardown()
          break
        }
        case 'complete': {
          const rawReason = String(message.reason ?? '')
          const reason: VivaCompletionReason =
            rawReason === 'time_limit'
              ? 'time_limit'
              : rawReason === 'question_limit'
                ? 'question_limit'
                : 'other'
          setCompletionReason(reason)
          setProgress((current) => ({
            ...current,
            questionsAsked: Number(message.questions_asked ?? current.questionsAsked),
            questionsAnswered: Number(message.questions_answered ?? current.questionsAnswered),
            secondsElapsed: Number(message.seconds_elapsed ?? current.secondsElapsed),
            secondsRemaining: 0,
          }))
          if (message.assessment != null) {
            setAssessment(message.assessment as unknown as VoiceVivaAssessment)
          }
          if (typeof message.assessment_error === 'string') {
            setAssessmentError(message.assessment_error)
          }
          setStatus('ended')
          void teardown()
          break
        }
        case 'error': {
          setErrorMessage(String(message.message ?? 'The voice viva failed.'))
          setStatus('error')
          break
        }
        default:
          break
      }
    }

    socket.onerror = () => {
      setErrorMessage('Lost the connection to the voice examiner.')
      setStatus('error')
    }

    socket.onclose = () => {
      setStatus((current) => (current === 'error' ? current : 'ended'))
    }
  }, [appendTranscript, sessionId, teardown])

  const stop = useCallback(async () => {
    stoppingRef.current = true
    // Send stop and let the server grade before it closes, rather than tearing the
    // socket down here — the assessment arrives on the `complete` frame.
    const socket = socketRef.current
    if (socket !== null && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ type: 'stop' }))
      } catch {
        await teardown()
        setStatus('ended')
      }
      return
    }
    await teardown()
    setStatus('ended')
  }, [teardown])

  const isLive =
    status === 'listening' || status === 'student_speaking' || status === 'examiner_speaking'
  const isGrading = status === 'grading'

  // The server only pushes progress when a transcript event lands, so tick the clock
  // locally to keep the countdown smooth. Server frames overwrite this.
  useEffect(() => {
    if (!isLive || completionReason !== null) {
      return
    }
    const interval = window.setInterval(() => {
      setProgress((current) => ({
        ...current,
        secondsElapsed: current.secondsElapsed + 1,
        secondsRemaining: Math.max(0, current.secondsRemaining - 1),
      }))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [completionReason, isLive])

  return {
    status,
    isLive,
    isGrading,
    errorMessage,
    transcript,
    micLevel,
    progress,
    completionReason,
    assessment,
    assessmentError,
    maxQuestions,
    maxSeconds,
    topicTitle,
    setAssessment,
    start,
    stop,
  }
}
