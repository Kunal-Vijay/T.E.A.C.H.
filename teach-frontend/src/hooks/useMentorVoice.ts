import { useCallback, useRef } from 'react'
import { getLessonIntro, pickDialogue, shouldPlayLessonIntro } from '../lib/mentors/dialogue'
import { buildSpeechChunks } from '../lib/speech/sentenceChunker'
import type { DialogueCategory, MentorDefinition } from '../types/mentor.types'
import { useSpeech, type SpeakMentorOptions } from './useSpeech'

export function useMentorVoice(onExpression?: (speaking: boolean) => void) {
  const { speechStatus, speechError, speakNow, speakSequence, stopSpeech, isSupported, isMuted, warmUp } = useSpeech()
  const demoTimerRef = useRef<number | null>(null)

  const clearDemoTimer = useCallback(() => {
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current)
      demoTimerRef.current = null
    }
  }, [])

  const buildChunks = useCallback((mentor: MentorDefinition, text: string) => {
    return buildSpeechChunks(text, {
      chunkSpeech: mentor.voice.chunkSpeech,
      maxCharsPerChunk: mentor.voice.maxCharsPerChunk,
    })
  }, [])

  const speakAsMentor = useCallback(async (
    mentor: MentorDefinition,
    text: string,
    extra?: Pick<SpeakMentorOptions, 'onSentenceStart' | 'onSentenceEnd'>,
  ) => {
    if (isMuted || text.trim() === '') {
      return false
    }

    clearDemoTimer()
    warmUp()

    return speakNow(text, {
      voice: mentor.voice,
      mentor,
      onSentenceStart: (index, sentence) => {
        onExpression?.(true)
        extra?.onSentenceStart?.(index, sentence)
      },
      onSentenceEnd: extra?.onSentenceEnd,
    })
  }, [clearDemoTimer, isMuted, onExpression, speakNow, warmUp])

  const speakLessonContent = useCallback(async (mentor: MentorDefinition, lessonText: string) => {
    if (isMuted || lessonText.trim() === '') {
      return false
    }

    clearDemoTimer()
    warmUp()

    const segments: string[] = []
    if (shouldPlayLessonIntro(mentor)) {
      segments.push(getLessonIntro(mentor))
    }
    segments.push(...buildChunks(mentor, lessonText))

    if (segments.length === 0) {
      return false
    }

    onExpression?.(true)
    return speakSequence(segments, {
      voice: mentor.voice,
      mentor,
      onSentenceStart: () => onExpression?.(true),
      onEnd: () => onExpression?.(false),
    })
  }, [buildChunks, clearDemoTimer, isMuted, onExpression, speakSequence, warmUp])

  const previewVoice = useCallback(async (mentor: MentorDefinition, category: DialogueCategory = 'demoLines') => {
    const line = pickDialogue(mentor, category)
    return speakAsMentor(mentor, line)
  }, [speakAsMentor])

  const playDemo = useCallback(async (mentor: MentorDefinition) => {
    clearDemoTimer()
    warmUp()
    await speakAsMentor(mentor, pickDialogue(mentor, 'greetings'))
    demoTimerRef.current = window.setTimeout(() => {
      void speakAsMentor(mentor, pickDialogue(mentor, 'demoLines'))
    }, mentor.voice.pauseBetweenMs + 200)
  }, [clearDemoTimer, speakAsMentor, warmUp])

  const stopPreview = useCallback(() => {
    clearDemoTimer()
    stopSpeech()
    onExpression?.(false)
  }, [clearDemoTimer, onExpression, stopSpeech])

  return {
    speechStatus,
    speechError,
    isSupported,
    isMuted,
    speakAsMentor,
    speakLessonContent,
    previewVoice,
    playDemo,
    stopPreview,
    warmUp,
  }
}
