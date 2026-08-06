export { MENTOR_CATALOG, MENTOR_CONFIGS } from './configs/mentors.config'
export {
  getDialogueLine,
  getDialogueForQuiz,
  getLessonIntro,
  pickDialogue,
  shouldPlayLessonIntro,
} from './dialogue'
export { classroomModeToExpression, quizResultToExpression } from './expressionMapping'
export {
  createExpressionController,
  type ExpressionController,
} from './expressionController'
export { transitionExpression, canTransition } from './expressionStateMachine'

import { MENTOR_CATALOG, MENTOR_CONFIGS } from './configs/mentors.config'
import type { MentorDefinition, TutorId } from '../../types/mentor.types'

export const MENTOR_LIST: MentorDefinition[] = MENTOR_CONFIGS

export function getMentorById(id: TutorId): MentorDefinition {
  return MENTOR_CATALOG[id]
}

export function isMentorId(value: string): value is TutorId {
  return value in MENTOR_CATALOG
}

export type { DialogueCategory, TutorId } from '../../types/mentor.types'
export { getMentorGifUrl, mentorHasGifAsset, MENTOR_GIF_ASSETS } from './mentorAssets'
