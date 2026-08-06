import { useCallback, useState } from 'react'
import {
  speechController,
  type SpeakOptions,
  type SpeechErrorCode,
  type SpeechStatus,
} from '../components/avatar/SpeechController'
import { buildSpeechChunks } from '../lib/speech/sentenceChunker'
import { isMentorSpeechMuted } from '../services/mentor/mentorPreferences'
import type { MentorDefinition, VoiceProfile } from '../types/mentor.types'

export interface SpeakMentorOptions {
  voice?: VoiceProfile
  mentor?: MentorDefinition
  onEnd?: () => void
  onSentenceStart?: SpeakOptions['onSentenceStart']
  onSentenceEnd?: SpeakOptions['onSentenceEnd']
}

export function useSpeech() {
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(
    speechController.isSupported() ? 'idle' : 'unsupported',
  )
  const [speechError, setSpeechError] = useState<string | null>(null)

  const speakSequence = useCallback(async (chunks: string[], options?: SpeakMentorOptions) => {
    if (isMentorSpeechMuted()) {
      return false
    }

    setSpeechError(null)
    if (!speechController.isSupported()) {
      setSpeechStatus('unsupported')
      setSpeechError('Audio playback is not supported in this browser.')
      return false
    }

    const sentences = chunks.map((c) => c.trim()).filter((c) => c !== '')
    if (sentences.length === 0) {
      return false
    }

    setSpeechStatus('speaking')
    const speakOptions: SpeakOptions = {
      voice: options?.voice,
      onSentenceStart: options?.onSentenceStart,
      onSentenceEnd: options?.onSentenceEnd,
      onEnd: () => {
        setSpeechStatus('idle')
        options?.onEnd?.()
      },
      onError: (errorCode: SpeechErrorCode) => {
        setSpeechStatus('error')
        setSpeechError(buildSpeechErrorMessage(errorCode))
      },
    }

    const started = await speechController.speakSequence(sentences, speakOptions)

    if (!started) {
      setSpeechStatus('idle')
    }
    return started
  }, [])

  const speakNow = useCallback(async (text: string, options?: SpeakMentorOptions) => {
    const voice = options?.voice
    const chunks = voice !== undefined && options?.mentor?.behavior.chunkSpeech !== false
      ? buildSpeechChunks(text, {
          chunkSpeech: voice.chunkSpeech,
          maxCharsPerChunk: voice.maxCharsPerChunk,
        })
      : [text.trim()].filter((c) => c !== '')

    return speakSequence(chunks, options)
  }, [speakSequence])

  const stopSpeech = useCallback(() => {
    speechController.stop()
    setSpeechStatus('idle')
  }, [])

  const withSpeaking = useCallback(async (task: () => Promise<boolean>) => {
    if (isMentorSpeechMuted()) {
      return false
    }

    setSpeechError(null)
    if (!speechController.isSupported()) {
      setSpeechStatus('unsupported')
      setSpeechError('Audio playback is not supported in this browser.')
      return false
    }

    setSpeechStatus('speaking')
    try {
      return await task()
    } catch {
      setSpeechStatus('error')
      return false
    } finally {
      setSpeechStatus('idle')
    }
  }, [])

  return {
    speechStatus,
    speechError,
    speakNow,
    speakSequence,
    stopSpeech,
    withSpeaking,
    isSupported: speechController.isSupported(),
    isMuted: isMentorSpeechMuted(),
    warmUp: () => speechController.warmUp(),
  }
}

function buildSpeechErrorMessage(errorCode: SpeechErrorCode): string {
  if (errorCode === 'network') {
    return 'Could not load mentor audio. Make sure the backend is running on port 8000.'
  }
  if (errorCode === 'synthesis-failed') {
    return 'Audio playback failed. Check your browser tab is not muted and try again.'
  }
  return 'Could not play speech. Try the voice preview again.'
}
