import { useCallback, useEffect, useRef, useState } from 'react'
import {
  NovaAudioPlayer,
  NovaMicCapture,
  buildUnderstandingCheckSocketUrl,
  isVoiceCaptureSupported,
} from '../lib/voice/novaSonicAudio'

export type VoiceSessionStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'student_speaking'
  | 'tutor_speaking'
  | 'ended'
  | 'error'

export interface TranscriptTurn {
  id: string
  role: 'USER' | 'ASSISTANT'
  text: string
  at: number
}

export interface VoiceSessionMeta {
  topicTitle: string
  maxQuestions: number
  maxSeconds: number
}

export interface VivaProgress {
  questionsAsked: number
  questionsAnswered: number
  secondsElapsed: number
  secondsRemaining: number
}

/** Why the viva ended, when it ended on its own. */
export type VivaCompletionReason = 'question_limit' | 'time_limit' | null

interface StartArgs {
  generationId: string
  topicId: string
  classroomSessionId?: string | null
}

/**
 * Drives one voice "check your understanding" session.
 *
 * Owns the WebSocket to the backend relay, microphone capture at 16 kHz, and
 * playback of the tutor's 24 kHz audio. Transcript turns from the same speaker
 * are merged so the UI shows whole sentences rather than streamed fragments.
 */
export function useUnderstandingCheck() {
  const [status, setStatus] = useState<VoiceSessionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([])
  const [meta, setMeta] = useState<VoiceSessionMeta | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const [progress, setProgress] = useState<VivaProgress>({
    questionsAsked: 0,
    questionsAnswered: 0,
    secondsElapsed: 0,
    secondsRemaining: 0,
  })
  const [completionReason, setCompletionReason] = useState<VivaCompletionReason>(null)

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
      // Nova Sonic emits partial fragments; merge consecutive same-speaker text.
      if (last !== undefined && last.role === role && Date.now() - last.at < 8000) {
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

  const start = useCallback(
    async ({ generationId, topicId, classroomSessionId }: StartArgs) => {
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
      setMeta(null)
      setCompletionReason(null)

      const player = new NovaAudioPlayer()
      playerRef.current = player
      // Must happen inside the click handler's task for autoplay policies.
      await player.resume()

      const socket = new WebSocket(
        buildUnderstandingCheckSocketUrl({ generationId, topicId, classroomSessionId }),
      )
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

          // Derive "tutor is talking" from whether audio is still queued.
          speakingTimerRef.current = window.setInterval(() => {
            const speaking = playerRef.current?.isSpeaking ?? false
            setStatus((current) => {
              if (current === 'student_speaking' || current === 'ended' || current === 'error') {
                return current
              }
              if (speaking) {
                return 'tutor_speaking'
              }
              return current === 'tutor_speaking' ? 'listening' : current
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
            const maxSeconds = Number(message.max_seconds ?? 120)
            setMeta({
              topicTitle: String(message.topic_title ?? ''),
              maxQuestions: Number(message.max_questions ?? 10),
              maxSeconds,
            })
            setProgress({
              questionsAsked: 0,
              questionsAnswered: 0,
              secondsElapsed: 0,
              secondsRemaining: maxSeconds,
            })
            setStatus('listening')
            void beginCapture()
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
          case 'complete': {
            const reason = message.reason === 'time_limit' ? 'time_limit' : 'question_limit'
            setProgress((current) => ({
              ...current,
              questionsAsked: Number(message.questions_asked ?? current.questionsAsked),
              questionsAnswered: Number(message.questions_answered ?? current.questionsAnswered),
              secondsElapsed: Number(message.seconds_elapsed ?? current.secondsElapsed),
              secondsRemaining: 0,
            }))
            setCompletionReason(reason)
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
            // Nova Sonic stopped generating because the student cut in. Audio is
            // produced faster than it plays, so there is a backlog queued that must
            // be dropped now — otherwise the tutor keeps talking over them.
            playerRef.current?.flush()
            setStatus('student_speaking')
            break
          }
          case 'speech': {
            if (message.state === 'start') {
              // Drop queued speech the moment the student starts talking, so
              // barge-in feels immediate rather than waiting for the server signal.
              playerRef.current?.flush()
              setStatus('student_speaking')
            } else {
              setStatus((current) => (current === 'student_speaking' ? 'listening' : current))
            }
            break
          }
          case 'error': {
            setErrorMessage(String(message.message ?? 'The voice session failed.'))
            setStatus('error')
            break
          }
          case 'closed': {
            if (!stoppingRef.current) {
              setStatus('ended')
            }
            break
          }
          default:
            break
        }
      }

      socket.onerror = () => {
        setErrorMessage('Lost the connection to the voice service.')
        setStatus('error')
      }

      socket.onclose = () => {
        setStatus((current) => (current === 'error' ? current : 'ended'))
      }
    },
    [appendTranscript],
  )

  const stop = useCallback(async () => {
    stoppingRef.current = true
    await teardown()
    setStatus('ended')
  }, [teardown])

  const reset = useCallback(async () => {
    stoppingRef.current = true
    await teardown()
    setStatus('idle')
    setErrorMessage(null)
    setTranscript([])
    setMeta(null)
    setCompletionReason(null)
    setProgress({
      questionsAsked: 0,
      questionsAnswered: 0,
      secondsElapsed: 0,
      secondsRemaining: 0,
    })
  }, [teardown])

  const isLive =
    status === 'listening' || status === 'student_speaking' || status === 'tutor_speaking'

  // The server only pushes progress when a transcript event lands, so tick the clock
  // locally to keep the countdown smooth. The server frame is authoritative and
  // overwrites this whenever it arrives.
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

  const maxQuestions = meta?.maxQuestions ?? 10
  const maxSeconds = meta?.maxSeconds ?? 120

  return {
    status,
    isLive,
    errorMessage,
    transcript,
    meta,
    micLevel,
    progress,
    completionReason,
    maxQuestions,
    maxSeconds,
    start,
    stop,
    reset,
  }
}
