import type { ExpressionState } from '../../types/mentor.types'

/** Interactive avatar animation states (no AI coupling). */
export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'talking'
  | 'happy'
  | 'confused'
  | 'celebrating'

export const AVATAR_STATES: readonly AvatarState[] = [
  'idle',
  'listening',
  'thinking',
  'talking',
  'happy',
  'confused',
  'celebrating',
]

/** Map legacy expression states onto interactive avatar states. */
export function expressionToAvatarState(expression?: ExpressionState): AvatarState {
  switch (expression) {
    case 'listening':
    case 'curious':
      return 'listening'
    case 'thinking':
      return 'thinking'
    case 'speaking':
    case 'explaining':
      return 'talking'
    case 'happy':
    case 'smile':
    case 'laugh':
    case 'proud':
    case 'encouraging':
      return 'happy'
    case 'confused':
    case 'concerned':
      return 'confused'
    case 'celebrating':
    case 'excited':
      return 'celebrating'
    default:
      return 'idle'
  }
}
