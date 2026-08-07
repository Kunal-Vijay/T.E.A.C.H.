import { useCallback, useRef, useState } from 'react'
import { speechController } from '../components/avatar/SpeechController'
import { chunkTextForSpeech } from '../lib/speech/sentenceChunker'
import { useSpeech } from './useSpeech'

const LIVE_SESSION_CHUNK_SIZE = 180

function joinSpeechChunks(completedText: string, nextChunk: string): string {
  if (completedText === '') {
    return nextChunk
  }
  if (nextChunk === '') {
    return completedText
  }
  return `${completedText} ${nextChunk}`
}

export function useLiveSessionTutorSpeech() {
  const {
    speakSequence,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    togglePauseSpeech,
    prefetchSpeech,
    speechStatus,
    speechError,
    isPaused,
  } = useSpeech()
  const [fullText, setFullText] = useState('')
  const [revealedText, setRevealedText] = useState('')
  const lastSpokenRef = useRef<string | null>(null)
  const playbackGenerationRef = useRef(0)
  const completedChunksRef = useRef('')

  const interruptSpeech = useCallback(() => {
    playbackGenerationRef.current += 1
    stopSpeech()
  }, [stopSpeech])

  const resetSpeechTracking = useCallback(() => {
    playbackGenerationRef.current += 1
    lastSpokenRef.current = null
    stopSpeech()
    setFullText('')
    setRevealedText('')
    completedChunksRef.current = ''
  }, [stopSpeech])

  const speakTutorText = useCallback(async (
    text: string,
    languageStyle?: string,
    onEndCallback?: () => void,
  ) => {
    const trimmedText = text.trim()
    if (trimmedText === '' || trimmedText === lastSpokenRef.current) {
      return false
    }

    lastSpokenRef.current = trimmedText
    const playbackGeneration = playbackGenerationRef.current + 1
    playbackGenerationRef.current = playbackGeneration
    completedChunksRef.current = ''
    setFullText(trimmedText)
    setRevealedText('')

    const speechChunks = chunkTextForSpeech(trimmedText, LIVE_SESSION_CHUNK_SIZE)
    if (speechChunks.length === 0) {
      setRevealedText(trimmedText)
      return false
    }

    prefetchSpeech(speechChunks)

    return speakSequence(speechChunks, {
      languageStyle,
      onPlaybackProgress: (_index, chunkText, currentTimeSeconds, durationSeconds) => {
        if (playbackGeneration !== playbackGenerationRef.current) {
          return
        }
        const progressRatio = durationSeconds > 0
          ? Math.min(1, currentTimeSeconds / durationSeconds)
          : 0
        const visibleCharacterCount = Math.max(1, Math.ceil(chunkText.length * progressRatio))
        const partialChunk = chunkText.slice(0, visibleCharacterCount)
        setRevealedText(joinSpeechChunks(completedChunksRef.current, partialChunk))
      },
      onSentenceEnd: (_index, chunkText) => {
        if (playbackGeneration !== playbackGenerationRef.current) {
          return
        }
        completedChunksRef.current = joinSpeechChunks(completedChunksRef.current, chunkText)
        setRevealedText(completedChunksRef.current)
      },
      onEnd: () => {
        if (playbackGeneration !== playbackGenerationRef.current) {
          return
        }
        setRevealedText(trimmedText)
        onEndCallback?.()
      },
    })
  }, [prefetchSpeech, speakSequence])

  const replayTutorText = useCallback(async (languageStyle?: string) => {
    if (fullText.trim() === '') {
      return false
    }
    lastSpokenRef.current = null
    return speakTutorText(fullText, languageStyle)
  }, [fullText, speakTutorText])

  const isSpeechActive =
    speechStatus === 'loading' || speechStatus === 'speaking' || speechStatus === 'paused'

  return {
    fullText,
    revealedText,
    speechStatus,
    speechError,
    isPaused,
    isSpeechActive,
    speakTutorText,
    replayTutorText,
    interruptSpeech,
    resetSpeechTracking,
    pauseSpeech,
    resumeSpeech,
    togglePauseSpeech,
    isSupported: speechController.isSupported(),
  }
}
