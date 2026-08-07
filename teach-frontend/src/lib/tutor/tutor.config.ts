import { getMentorById } from '../mentors'
import type { MentorDefinition, TutorId } from '../../types/mentor.types'

/** Active tutor id — single source of truth for the product. */
export const CURRENT_TUTOR_ID = 'nova' satisfies TutorId

export const TUTOR_ROLE = 'Teacher' as const

export interface CurrentTutorConfig {
  id: TutorId
  name: string
  role: typeof TUTOR_ROLE
  definition: MentorDefinition
}

/** Full tutor configuration consumed across the app. */
export const CURRENT_TUTOR: CurrentTutorConfig = {
  id: CURRENT_TUTOR_ID,
  name: 'Nova',
  role: TUTOR_ROLE,
  definition: getMentorById(CURRENT_TUTOR_ID),
}

export function getCurrentTutor(): MentorDefinition {
  return CURRENT_TUTOR.definition
}

export function getTutorDisplayName(): string {
  return CURRENT_TUTOR.name
}

export function getTutorLabel(): string {
  return CURRENT_TUTOR.name
}

export function getTutorAriaLabel(action?: 'explaining' | 'thinking' | 'listening'): string {
  switch (action) {
    case 'explaining':
      return 'Explaining'
    case 'thinking':
      return 'Thinking'
    case 'listening':
      return 'Listening'
    default:
      return CURRENT_TUTOR.name
  }
}
