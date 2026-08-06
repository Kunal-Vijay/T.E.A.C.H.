import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  INITIAL_LESSON_SECTION_STATE,
  canShowContinueForLiveSection,
  isLessonPaused,
  lessonSectionReducer,
  type LessonSectionPhase,
} from '../lib/classroom/lessonSectionState'

interface UseLessonSectionFlowOptions {
  slideKey: string
  isLiveLesson: boolean
}

export function useLessonSectionFlow({ slideKey, isLiveLesson }: UseLessonSectionFlowOptions) {
  const [state, dispatch] = useReducer(lessonSectionReducer, INITIAL_LESSON_SECTION_STATE)
  const slideKeyRef = useRef(slideKey)

  useEffect(() => {
    if (slideKeyRef.current !== slideKey) {
      slideKeyRef.current = slideKey
      dispatch({ type: 'SLIDE_CHANGED' })
    }
  }, [slideKey])

  const markNarrationComplete = useCallback(() => {
    dispatch({ type: 'NARRATION_COMPLETE' })
  }, [])

  const onReplayStarted = useCallback(() => {
    dispatch({ type: 'REPLAY_STARTED' })
  }, [])

  const openDoubt = useCallback(() => {
    dispatch({ type: 'DOUBT_OPENED' })
  }, [])

  const finishDoubt = useCallback(() => {
    dispatch({ type: 'DOUBT_FINISHED' })
  }, [])

  const phase: LessonSectionPhase = state.phase
  const lessonPaused = isLiveLesson && isLessonPaused(phase)
  const showVoiceDoubtPrompt = isLiveLesson && phase === 'waiting_for_doubts'
  const readyToContinue = isLiveLesson && canShowContinueForLiveSection(phase)
  const isTeaching = phase === 'teaching'

  return {
    phase,
    isTeaching,
    lessonPaused,
    showVoiceDoubtPrompt,
    readyToContinue,
    narrationComplete: state.narrationComplete,
    markNarrationComplete,
    onReplayStarted,
    openDoubt,
    finishDoubt,
  }
}
