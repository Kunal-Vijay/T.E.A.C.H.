import type { AvatarExpression } from './AvatarExpression'

/** Canonical avatar lifecycle states for InteractiveAvatar. */
export type AvatarMachineState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'talking'
  | 'happy'
  | 'celebrating'
  | 'error'

export const AVATAR_MACHINE_STATES: readonly AvatarMachineState[] = [
  'idle',
  'listening',
  'thinking',
  'talking',
  'happy',
  'celebrating',
  'error',
]

/** Application signals — derive from classroom / voice / speech hooks. */
export interface AvatarMachineInput {
  /** Student or mic input active. */
  isListening?: boolean
  /** Waiting on AI / processing. */
  isThinking?: boolean
  /** TTS or streamed response in progress. */
  isStreaming?: boolean
  /** Speech or playback failed. */
  hasError?: boolean
  /** Milestone / quiz celebration overlay. */
  isCelebrating?: boolean
  /** Sustained friendly smile (e.g. doubt invitation). */
  preferHappy?: boolean
}

export interface AvatarMachineOutput {
  state: AvatarMachineState
  expression: AvatarExpression
  isTalking: boolean
}

export const AVATAR_MACHINE_PRIORITY: Record<AvatarMachineState, number> = {
  idle: 0,
  listening: 10,
  thinking: 20,
  happy: 25,
  talking: 40,
  celebrating: 50,
  error: 60,
}

/** Duration of post-response smile before settling. */
export const AVATAR_HAPPY_PULSE_MS = 1300

export function mapMachineStateToOutput(state: AvatarMachineState): AvatarMachineOutput {
  switch (state) {
    case 'listening':
      return { state, expression: 'listening', isTalking: false }
    case 'thinking':
      return { state, expression: 'thinking', isTalking: false }
    case 'talking':
      return { state, expression: 'teaching', isTalking: true }
    case 'happy':
      return { state, expression: 'happy', isTalking: false }
    case 'celebrating':
      return { state, expression: 'celebrating', isTalking: false }
    case 'error':
      return { state, expression: 'confused', isTalking: false }
    default:
      return { state: 'idle', expression: 'idle', isTalking: false }
  }
}

/** Legacy ExpressionState for GIF wrapper CSS — InteractiveAvatar uses machine output. */
export function machineStateToLegacyExpression(state: AvatarMachineState): import('../../types/mentor.types').ExpressionState {
  switch (state) {
    case 'listening':
      return 'listening'
    case 'thinking':
      return 'thinking'
    case 'talking':
      return 'speaking'
    case 'happy':
      return 'smile'
    case 'celebrating':
      return 'celebrating'
    case 'error':
      return 'confused'
    default:
      return 'idle'
  }
}
