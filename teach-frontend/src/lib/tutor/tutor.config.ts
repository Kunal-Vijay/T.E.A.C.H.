import { getMentorById } from '../mentors'
import { getMentorGifAsset } from '../mentors/mentorAssets'
import type { MentorDefinition, TutorId } from '../../types/mentor.types'

/** Active tutor id — single source of truth for the product. */
export const CURRENT_TUTOR_ID = 'nova' satisfies TutorId

export const TUTOR_ROLE = 'AI Tutor' as const

export interface CurrentTutorConfig {
  id: TutorId
  name: string
  role: typeof TUTOR_ROLE
  definition: MentorDefinition
  avatar: ReturnType<typeof getMentorGifAsset>
}

/** Full tutor configuration consumed across the app. */
export const CURRENT_TUTOR: CurrentTutorConfig = {
  id: CURRENT_TUTOR_ID,
  name: 'Nova',
  role: TUTOR_ROLE,
  definition: getMentorById(CURRENT_TUTOR_ID),
  avatar: getMentorGifAsset(CURRENT_TUTOR_ID),
}

export function getCurrentTutor(): MentorDefinition {
  return CURRENT_TUTOR.definition
}

export function getTutorDisplayName(): string {
  return CURRENT_TUTOR.name
}

export function getTutorLabel(): string {
  return `${CURRENT_TUTOR.name} • ${TUTOR_ROLE}`
}

export function getTutorAriaLabel(action?: 'explaining' | 'thinking' | 'listening'): string {
  switch (action) {
    case 'explaining':
      return `${CURRENT_TUTOR.name} is explaining`
    case 'thinking':
      return `${CURRENT_TUTOR.name} is thinking`
    case 'listening':
      return `${CURRENT_TUTOR.name} is listening`
    default:
      return `${CURRENT_TUTOR.name}, your ${TUTOR_ROLE}`
  }
}
