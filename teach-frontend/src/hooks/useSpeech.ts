import { useCallback, useState } from 'react'
import {
  speechController,
  type SpeechErrorCode,
  type SpeechStatus,
} from '../components/avatar/SpeechController'

export function useSpeech() {
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(
    speechController.isSupported() ? 'idle' : 'unsupported',
  )
  const [speechError, setSpeechError] = useState<string | null>(null)

  const speakNow = useCallback(async (text: string) => {
    setSpeechError(null)
    if (!speechController.isSupported()) {
      setSpeechStatus('unsupported')
      setSpeechError('Audio playback is not supported in this browser.')
      return false
    }

    setSpeechStatus('speaking')
    const started = await speechController.speak(text, {
      onEnd: () => setSpeechStatus('idle'),
      onError: (errorCode: SpeechErrorCode) => {
        setSpeechStatus('error')
        setSpeechError(buildSpeechErrorMessage(errorCode))
      },
    })

    if (!started) {
      setSpeechStatus('idle')
    }
    return started
  }, [])

  const stopSpeech = useCallback(() => {
    speechController.stop()
    setSpeechStatus('idle')
  }, [])

  return {
    speechStatus,
    speechError,
    speakNow,
    stopSpeech,
    isSupported: speechController.isSupported(),
    warmUp: () => speechController.warmUp(),
  }
}

function buildSpeechErrorMessage(errorCode: SpeechErrorCode): string {
  if (errorCode === 'timeout') {
    return 'Teacher audio is taking longer than expected. Please wait a moment and click Replay explanation.'
  }
  if (errorCode === 'network') {
    return 'Could not load teacher audio. Make sure the backend is running on port 8000.'
  }
  if (errorCode === 'not-allowed') {
    return 'Your browser blocked audio playback. Click Enable Teacher Voice and try again.'
  }
  if (errorCode === 'synthesis-failed') {
    return 'Audio playback failed. Check your browser tab is not muted and try Replay again.'
  }
  return 'Could not play speech. Try Replay explanation again.'
}
