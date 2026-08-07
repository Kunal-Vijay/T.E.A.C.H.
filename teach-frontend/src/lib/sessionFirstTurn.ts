import type { LearningSessionResponse } from '../types/learning.types'

export type FirstTurnStatus = 'preparing' | 'ready' | 'failed'

export interface PreparingMessage {
  headline: string
  detail: string
}

const PREPARING_MESSAGES: readonly PreparingMessage[] = [
  {
    headline: '🧠 Understanding the lesson',
    detail: 'Reviewing the topic and how to explain it clearly.',
  },
  {
    headline: '✏️ Preparing visual examples',
    detail: 'Sketching diagrams and examples for the whiteboard.',
  },
  {
    headline: '📋 Organizing the whiteboard',
    detail: 'Arranging ideas so each step builds naturally.',
  },
  {
    headline: '🎙️ Getting Nova ready',
    detail: 'Tuning voice and pacing for your session.',
  },
  {
    headline: '✨ Almost ready',
    detail: 'Putting the finishing touches on your first explanation.',
  },
] as const

export const FIRST_TURN_POLL_INTERVAL_MS = 2000

/** Rotate preparation copy every 2–3 seconds while Bedrock runs. */
export const PREPARING_MESSAGE_ROTATE_MS = 2600

export function getFirstTurnStatus(session: LearningSessionResponse): FirstTurnStatus | null {
  const raw = session.mode_state.first_turn_status
  if (raw === 'preparing' || raw === 'ready' || raw === 'failed') {
    return raw
  }
  return null
}

export function hasFirstTutorTurn(session: LearningSessionResponse): boolean {
  return session.turns.some((turn) => turn.role === 'tutor')
}

export function isFirstTurnPreparing(session: LearningSessionResponse): boolean {
  if (session.mode === 'viva') {
    return false
  }
  if (getFirstTurnStatus(session) === 'failed') {
    return false
  }
  return !hasFirstTutorTurn(session)
}

export function isFirstTurnFailed(session: LearningSessionResponse): boolean {
  return getFirstTurnStatus(session) === 'failed'
}

export function getFirstTurnError(session: LearningSessionResponse): string | null {
  const raw = session.mode_state.first_turn_error
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

export function pickPreparingMessage(index: number): PreparingMessage {
  return PREPARING_MESSAGES[index % PREPARING_MESSAGES.length]
}
