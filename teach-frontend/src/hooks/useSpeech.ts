import { useCallback, useRef, useState } from 'react'
import {
  speechController,
  type SpeakOptions,
  type SpeechErrorCode,
  type SpeechStatus,
} from '../components/avatar/SpeechController'
import { buildSpeechChunks } from '../lib/speech/sentenceChunker'
import type { MentorDefinition, VoiceProfile } from '../types/mentor.types'

export interface SpeakMentorOptions {
  voice?: VoiceProfile
  mentor?: MentorDefinition
  languageStyle?: string
  /** ElevenLabs persona ID (e.g. "male", "female"). From MentorContext. */
  persona?: string
  onEnd?: () => void
  onSentenceStart?: SpeakOptions['onSentenceStart']
  onSentenceEnd?: SpeakOptions['onSentenceEnd']
  onPlaybackStart?: SpeakOptions['onPlaybackStart']
  onPlaybackProgress?: SpeakOptions['onPlaybackProgress']
}

export function useSpeech() {
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(
    speechController.isSupported() ? 'idle' : 'unsupported',
  )
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const speechStatusRef = useRef<SpeechStatus>(speechStatus)

  const updateSpeechStatus = useCallback((nextStatus: SpeechStatus) => {
    speechStatusRef.current = nextStatus
    setSpeechStatus(nextStatus)
  }, [])

  const speakSequence = useCallback(async (chunks: string[], options?: SpeakMentorOptions) => {
    setSpeechError(null)
    setIsPaused(false)
    if (!speechController.isSupported()) {
      updateSpeechStatus('unsupported')
      setSpeechError('Audio playback is not supported in this browser.')
      return false
    }

    const sentences = chunks.map((chunk) => chunk.trim()).filter((chunk) => chunk !== '')
    if (sentences.length === 0) {
      return false
    }

    updateSpeechStatus('loading')
    const speakOptions: SpeakOptions = {
      voice: options?.voice,
      languageStyle: options?.languageStyle,
      persona: options?.persona,
      onSentenceStart: (index, text) => {
        if (speechStatusRef.current !== 'paused') {
          updateSpeechStatus('speaking')
        }
        options?.onSentenceStart?.(index, text)
      },
      onSentenceEnd: options?.onSentenceEnd,
      onPlaybackStart: (index, text) => {
        if (speechStatusRef.current !== 'paused') {
          updateSpeechStatus('speaking')
        }
        options?.onPlaybackStart?.(index, text)
      },
      onPlaybackProgress: options?.onPlaybackProgress,
      onEnd: () => {
        updateSpeechStatus('idle')
        setIsPaused(false)
        options?.onEnd?.()
      },
      onError: (errorCode: SpeechErrorCode) => {
        updateSpeechStatus('error')
        setIsPaused(false)
        setSpeechError(buildSpeechErrorMessage(errorCode))
      },
    }

    const started = await speechController.speakSequence(sentences, speakOptions)

    if (!started) {
      updateSpeechStatus('idle')
      setIsPaused(false)
    }
    return started
  }, [updateSpeechStatus])

  const speakNow = useCallback(async (text: string, options?: SpeakMentorOptions) => {
    const voice = options?.voice
    const chunks = voice !== undefined && options?.mentor?.behavior.chunkSpeech !== false
      ? buildSpeechChunks(text, {
          chunkSpeech: voice.chunkSpeech,
          maxCharsPerChunk: voice.maxCharsPerChunk,
        })
      : [text.trim()].filter((chunk) => chunk !== '')

    return speakSequence(chunks, options)
  }, [speakSequence])

  const stopSpeech = useCallback(() => {
    speechController.stop()
    updateSpeechStatus('idle')
    setIsPaused(false)
  }, [updateSpeechStatus])

  const pauseSpeech = useCallback(() => {
    const currentStatus = speechStatusRef.current
    if (
      currentStatus !== 'speaking'
      && currentStatus !== 'loading'
    ) {
      return
    }
    speechController.pause()
    updateSpeechStatus('paused')
    setIsPaused(true)
  }, [updateSpeechStatus])

  const resumeSpeech = useCallback(() => {
    if (speechStatusRef.current !== 'paused') {
      return
    }
    speechController.resume()
    updateSpeechStatus('speaking')
    setIsPaused(false)
  }, [updateSpeechStatus])

  const togglePauseSpeech = useCallback(() => {
    if (speechStatusRef.current === 'paused') {
      resumeSpeech()
      return
    }
    pauseSpeech()
  }, [pauseSpeech, resumeSpeech])

  const withSpeaking = useCallback(async (task: () => Promise<boolean>) => {
    setSpeechError(null)
    if (!speechController.isSupported()) {
      updateSpeechStatus('unsupported')
      setSpeechError('Audio playback is not supported in this browser.')
      return false
    }

    updateSpeechStatus('speaking')
    try {
      return await task()
    } catch {
      updateSpeechStatus('error')
      return false
    } finally {
      updateSpeechStatus('idle')
      setIsPaused(false)
    }
  }, [updateSpeechStatus])

  return {
    speechStatus,
    speechError,
    isPaused,
    speakNow,
    speakSequence,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    togglePauseSpeech,
    withSpeaking,
    isSupported: speechController.isSupported(),
    warmUp: () => speechController.warmUp(),
    prefetchSpeech: (segments: string[]) => speechController.prefetchAll(segments),
  }
}

function buildSpeechErrorMessage(errorCode: SpeechErrorCode): string {
  if (errorCode === 'timeout') {
    return 'Teacher audio is taking longer than expected. Please wait a moment and click Replay explanation.'
  }
  if (errorCode === 'network') {
    return 'Could not load AI Tutor audio. Make sure the backend is running on port 8000.'
  }
  if (errorCode === 'not-allowed') {
    return 'Your browser blocked audio playback. Click Enable Teacher Voice and try again.'
  }
  if (errorCode === 'synthesis-failed') {
    return 'Audio playback failed. Check your browser tab is not muted and try again.'
  }
  return 'Could not play speech. Try the voice preview again.'
}
