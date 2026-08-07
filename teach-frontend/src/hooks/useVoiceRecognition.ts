import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createSpeechRecognitionService,
  type SpeechRecognitionErrorCode,
  type SpeechRecognitionService,
} from '../lib/speech/SpeechRecognitionService'

export type VoiceRecognitionPhase = 'idle' | 'listening' | 'review' | 'error'

interface UseVoiceRecognitionOptions {
  language?: string
  silenceTimeoutMs?: number
  onAutoStop?: (transcript: string) => void
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const serviceRef = useRef<SpeechRecognitionService | null>(null)
  const [phase, setPhase] = useState<VoiceRecognitionPhase>('idle')
  const [transcript, setTranscript] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [errorCode, setErrorCode] = useState<SpeechRecognitionErrorCode | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const getService = useCallback(() => {
    if (serviceRef.current === null) {
      serviceRef.current = createSpeechRecognitionService()
    }
    return serviceRef.current
  }, [])

  const isSupported = getService().isSupported()

  const reset = useCallback(() => {
    getService().abort()
    setPhase('idle')
    setTranscript('')
    setLiveTranscript('')
    setErrorCode(null)
    setErrorMessage(null)
  }, [getService])

  const startListening = useCallback(() => {
    const service = getService()
    setTranscript('')
    setLiveTranscript('')
    setErrorCode(null)
    setErrorMessage(null)
    setPhase('listening')

    service.start(
      {
        language: options.language ?? 'en-US',
        silenceTimeoutMs: options.silenceTimeoutMs ?? 1500,
      },
      {
        onResult: (result) => {
          setLiveTranscript(result.transcript)
          if (result.isFinal) {
            setTranscript(result.transcript)
          }
        },
        onEnd: (finalText) => {
          const text = finalText.trim()
          if (text !== '') {
            setTranscript(text)
            setLiveTranscript(text)
            setPhase('review')
            options.onAutoStop?.(text)
          } else {
            setPhase('idle')
          }
        },
        onError: (code, message) => {
          setErrorCode(code)
          setErrorMessage(message)
          setPhase('error')
        },
      },
    )
  }, [getService, options.language, options.onAutoStop, options.silenceTimeoutMs])

  const stopListening = useCallback(() => {
    getService().stop()
  }, [getService])

  const abortListening = useCallback(() => {
    getService().abort()
    setPhase('idle')
    setLiveTranscript('')
  }, [getService])

  useEffect(() => () => {
    serviceRef.current?.abort()
  }, [])

  return {
    isSupported,
    phase,
    transcript,
    liveTranscript,
    errorCode,
    errorMessage,
    startListening,
    stopListening,
    abortListening,
    reset,
    setTranscript,
    setPhase,
  }
}
