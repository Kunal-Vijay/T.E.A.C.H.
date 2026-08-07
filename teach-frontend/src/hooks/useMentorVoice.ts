import { useCallback, useRef } from 'react'
import { pickDialogue } from '../lib/mentors/dialogue'
import { playbackController, type SegmentPlaybackEvent } from '../lib/speech/PlaybackController'
import type { DialogueCategory, MentorDefinition } from '../types/mentor.types'
import { useSpeech, type SpeakMentorOptions } from './useSpeech'

export function useMentorVoice(onExpression?: (speaking: boolean) => void) {
  const { speechStatus, speechError, speakNow, stopSpeech, withSpeaking, isSupported, warmUp } = useSpeech()
  const demoTimerRef = useRef<number | null>(null)

  const clearDemoTimer = useCallback(() => {
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current)
      demoTimerRef.current = null
    }
  }, [])

  const speakAsMentor = useCallback(async (
    mentor: MentorDefinition,
    text: string,
    extra?: Pick<SpeakMentorOptions, 'onSentenceStart' | 'onSentenceEnd'>,
  ) => {
    if (text.trim() === '') {
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
  }, [clearDemoTimer, onExpression, speakNow, warmUp])

  const speakLessonContent = useCallback(async (
    mentor: MentorDefinition,
    lessonText: string,
    callbacks?: {
      onSegmentStart?: (event: SegmentPlaybackEvent) => void
      onCueStart?: (index: number, text: string) => void
      onEnd?: () => void
      onCancel?: () => void
    },
  ) => {
    if (lessonText.trim() === '') {
      return false
    }

    clearDemoTimer()
    warmUp()
    onExpression?.(true)

    return withSpeaking(() => playbackController.playLesson(mentor, lessonText, {
      onSegmentStart: (event) => {
        onExpression?.(true)
        callbacks?.onSegmentStart?.(event)
        if (event.cueIndex !== null) {
          callbacks?.onCueStart?.(event.cueIndex, event.text)
        }
      },
      onEnd: () => {
        onExpression?.(false)
        callbacks?.onEnd?.()
      },
      onCancel: () => {
        callbacks?.onCancel?.()
      },
    }))
  }, [clearDemoTimer, onExpression, warmUp, withSpeaking])

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
    playbackController.stop()
    stopSpeech()
    onExpression?.(false)
  }, [clearDemoTimer, onExpression, stopSpeech])

  return {
    speechStatus,
    speechError,
    isSupported,
    speakAsMentor,
    speakLessonContent,
    previewVoice,
    playDemo,
    stopPreview,
    warmUp,
  }
}
