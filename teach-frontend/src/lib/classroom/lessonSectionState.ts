/**
 * Explicit lesson-section flow for immersive classroom.
 *
 * TEACHING → WAITING_FOR_DOUBTS → ANSWERING_DOUBT → READY_TO_CONTINUE → (next slide) TEACHING
 */

export type LessonSectionPhase =
  | 'teaching'
  | 'waiting_for_doubts'
  | 'answering_doubt'
  | 'ready_to_continue'

export type LessonSectionAction =
  | { type: 'SLIDE_CHANGED' }
  | { type: 'NARRATION_COMPLETE' }
  | { type: 'DOUBT_PROMPT_SHOWN' }
  | { type: 'DOUBT_OPENED' }
  | { type: 'DOUBT_FINISHED' }
  | { type: 'REPLAY_STARTED' }

export interface LessonSectionState {
  phase: LessonSectionPhase
  /** Prevents duplicate narration-complete transitions for the same slide. */
  narrationComplete: boolean
}

export const INITIAL_LESSON_SECTION_STATE: LessonSectionState = {
  phase: 'teaching',
  narrationComplete: false,
}

export function lessonSectionReducer(
  state: LessonSectionState,
  action: LessonSectionAction,
): LessonSectionState {
  switch (action.type) {
    case 'SLIDE_CHANGED':
      return INITIAL_LESSON_SECTION_STATE

    case 'REPLAY_STARTED':
      return {
        phase: 'teaching',
        narrationComplete: false,
      }

    case 'NARRATION_COMPLETE':
      if (state.narrationComplete || state.phase !== 'teaching') {
        return state
      }
      return {
        phase: 'waiting_for_doubts',
        narrationComplete: true,
      }

    case 'DOUBT_PROMPT_SHOWN':
      if (state.phase !== 'waiting_for_doubts') {
        return state
      }
      return state

    case 'DOUBT_OPENED':
      if (state.phase !== 'waiting_for_doubts') {
        return state
      }
      return { ...state, phase: 'answering_doubt' }

    case 'DOUBT_FINISHED':
      if (state.phase === 'answering_doubt' || state.phase === 'waiting_for_doubts') {
        return { ...state, phase: 'ready_to_continue' }
      }
      return state

    default:
      return state
  }
}

export function isLessonPaused(phase: LessonSectionPhase): boolean {
  return phase === 'waiting_for_doubts' || phase === 'answering_doubt'
}

export function canShowContinueForLiveSection(phase: LessonSectionPhase): boolean {
  return phase === 'ready_to_continue'
}
