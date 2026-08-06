import type { ExpressionState } from '../../types/mentor.types'
import type { AvatarState } from './AvatarState'

/** Canonical interactive avatar expressions — state-driven, no UI coupling. */
export type AvatarExpression =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'confused'
  | 'surprised'
  | 'sad'
  | 'celebrating'
  | 'listening'
  | 'teaching'

export const AVATAR_EXPRESSIONS: readonly AvatarExpression[] = [
  'idle',
  'happy',
  'excited',
  'thinking',
  'confused',
  'surprised',
  'sad',
  'celebrating',
  'listening',
  'teaching',
]

/** Full-body pose snapshot consumed by the expression engine. */
export interface AvatarExpressionPose {
  eyeScaleY: number
  eyeX: number
  eyeY: number
  browLeftY: number
  browRightY: number
  browLeftRotate: number
  browRightRotate: number
  mouthScaleX: number
  mouthScaleY: number
  mouthCurve: number
  mouthOpacity: number
  headRotate: number
  headY: number
  bodyScale: number
  figureY: number
  handLeftRotate: number
  handLeftY: number
  handRightRotate: number
  handRightY: number
  rootY: number
  rootScale: number
  glowOpacity: number
  glowScale: number
}

export const AVATAR_EXPRESSION_POSES: Record<AvatarExpression, AvatarExpressionPose> = {
  idle: {
    eyeScaleY: 1,
    eyeX: 0,
    eyeY: 0,
    browLeftY: 0,
    browRightY: 0,
    browLeftRotate: -2,
    browRightRotate: 2,
    mouthScaleX: 1,
    mouthScaleY: 0.82,
    mouthCurve: 0,
    mouthOpacity: 0.85,
    headRotate: 0,
    headY: 0,
    bodyScale: 1,
    figureY: 0,
    handLeftRotate: 8,
    handLeftY: 0,
    handRightRotate: -8,
    handRightY: 0,
    rootY: 0,
    rootScale: 1,
    glowOpacity: 0.58,
    glowScale: 1,
  },
  happy: {
    eyeScaleY: 0.52,
    eyeX: 0,
    eyeY: 0.4,
    browLeftY: -1.8,
    browRightY: -1.8,
    browLeftRotate: -4,
    browRightRotate: 4,
    mouthScaleX: 1.18,
    mouthScaleY: 1.22,
    mouthCurve: -2,
    mouthOpacity: 1,
    headRotate: 3,
    headY: -2,
    bodyScale: 1.02,
    figureY: -1,
    handLeftRotate: 14,
    handLeftY: -2,
    handRightRotate: -14,
    handRightY: -2,
    rootY: -2,
    rootScale: 1.03,
    glowOpacity: 0.82,
    glowScale: 1.1,
  },
  excited: {
    eyeScaleY: 1.18,
    eyeX: 0,
    eyeY: -0.5,
    browLeftY: -2.8,
    browRightY: -2.8,
    browLeftRotate: -6,
    browRightRotate: 6,
    mouthScaleX: 1.22,
    mouthScaleY: 1.28,
    mouthCurve: -3,
    mouthOpacity: 1,
    headRotate: 2,
    headY: -3,
    bodyScale: 1.04,
    figureY: -2,
    handLeftRotate: 22,
    handLeftY: -5,
    handRightRotate: -22,
    handRightY: -5,
    rootY: -4,
    rootScale: 1.05,
    glowOpacity: 0.92,
    glowScale: 1.14,
  },
  thinking: {
    eyeScaleY: 0.38,
    eyeX: -1.2,
    eyeY: -2.2,
    browLeftY: -1.2,
    browRightY: 0.8,
    browLeftRotate: -5,
    browRightRotate: 8,
    mouthScaleX: 0.72,
    mouthScaleY: 0.78,
    mouthCurve: 2,
    mouthOpacity: 0.78,
    headRotate: 5,
    headY: -1,
    bodyScale: 0.98,
    figureY: 0,
    handLeftRotate: 18,
    handLeftY: -4,
    handRightRotate: -4,
    handRightY: 2,
    rootY: 0,
    rootScale: 1,
    glowOpacity: 0.68,
    glowScale: 1.04,
  },
  confused: {
    eyeScaleY: 1.12,
    eyeX: 0.8,
    eyeY: 0.6,
    browLeftY: 1.2,
    browRightY: -0.6,
    browLeftRotate: 6,
    browRightRotate: -4,
    mouthScaleX: 0.78,
    mouthScaleY: 0.88,
    mouthCurve: 4,
    mouthOpacity: 0.82,
    headRotate: -5,
    headY: 0,
    bodyScale: 0.99,
    figureY: 0,
    handLeftRotate: 4,
    handLeftY: 1,
    handRightRotate: -12,
    handRightY: 0,
    rootY: 0,
    rootScale: 1,
    glowOpacity: 0.52,
    glowScale: 1,
  },
  surprised: {
    eyeScaleY: 1.28,
    eyeX: 0,
    eyeY: -1,
    browLeftY: -3.5,
    browRightY: -3.5,
    browLeftRotate: -8,
    browRightRotate: 8,
    mouthScaleX: 0.82,
    mouthScaleY: 1.32,
    mouthCurve: 5,
    mouthOpacity: 1,
    headRotate: -2,
    headY: -2,
    bodyScale: 1.01,
    figureY: -1,
    handLeftRotate: 12,
    handLeftY: -3,
    handRightRotate: -12,
    handRightY: -3,
    rootY: -2,
    rootScale: 1.02,
    glowOpacity: 0.88,
    glowScale: 1.12,
  },
  sad: {
    eyeScaleY: 0.88,
    eyeX: 0,
    eyeY: 1.2,
    browLeftY: 1.8,
    browRightY: 1.8,
    browLeftRotate: 8,
    browRightRotate: -8,
    mouthScaleX: 0.88,
    mouthScaleY: 0.62,
    mouthCurve: 6,
    mouthOpacity: 0.72,
    headRotate: -3,
    headY: 2,
    bodyScale: 0.97,
    figureY: 2,
    handLeftRotate: 2,
    handLeftY: 3,
    handRightRotate: -2,
    handRightY: 3,
    rootY: 2,
    rootScale: 0.98,
    glowOpacity: 0.42,
    glowScale: 0.96,
  },
  celebrating: {
    eyeScaleY: 0.38,
    eyeX: 0,
    eyeY: 0.2,
    browLeftY: -2.4,
    browRightY: -2.4,
    browLeftRotate: -5,
    browRightRotate: 5,
    mouthScaleX: 1.24,
    mouthScaleY: 1.28,
    mouthCurve: -4,
    mouthOpacity: 1,
    headRotate: 4,
    headY: -4,
    bodyScale: 1.05,
    figureY: -3,
    handLeftRotate: 32,
    handLeftY: -8,
    handRightRotate: -32,
    handRightY: -8,
    rootY: -6,
    rootScale: 1.06,
    glowOpacity: 0.95,
    glowScale: 1.16,
  },
  listening: {
    eyeScaleY: 1.12,
    eyeX: 0.6,
    eyeY: 0.8,
    browLeftY: -0.8,
    browRightY: -0.4,
    browLeftRotate: -3,
    browRightRotate: 2,
    mouthScaleX: 0.88,
    mouthScaleY: 0.78,
    mouthCurve: 0,
    mouthOpacity: 0.88,
    headRotate: -3,
    headY: -1,
    bodyScale: 1.03,
    figureY: -1,
    handLeftRotate: 6,
    handLeftY: 0,
    handRightRotate: -6,
    handRightY: 0,
    rootY: 0,
    rootScale: 1.03,
    glowOpacity: 0.74,
    glowScale: 1.08,
  },
  teaching: {
    eyeScaleY: 1.05,
    eyeX: 0,
    eyeY: 0.4,
    browLeftY: -1,
    browRightY: -0.6,
    browLeftRotate: -3,
    browRightRotate: 3,
    mouthScaleX: 1.05,
    mouthScaleY: 0.95,
    mouthCurve: -1,
    mouthOpacity: 0.92,
    headRotate: -1.5,
    headY: -1,
    bodyScale: 1.02,
    figureY: -1,
    handLeftRotate: 10,
    handLeftY: -1,
    handRightRotate: -24,
    handRightY: -6,
    rootY: -1,
    rootScale: 1.02,
    glowOpacity: 0.78,
    glowScale: 1.1,
  },
}

/** Map legacy mentor expression states onto avatar expressions. */
export function expressionToAvatarExpression(expression?: ExpressionState): AvatarExpression {
  switch (expression) {
    case 'happy':
    case 'smile':
    case 'laugh':
    case 'proud':
    case 'encouraging':
      return 'happy'
    case 'excited':
      return 'excited'
    case 'thinking':
      return 'thinking'
    case 'confused':
    case 'concerned':
      return 'confused'
    case 'celebrating':
      return 'celebrating'
    case 'listening':
    case 'curious':
      return 'listening'
    case 'speaking':
    case 'explaining':
      return 'teaching'
    default:
      return 'idle'
  }
}

/** Bridge deprecated AvatarState onto AvatarExpression. */
export function avatarStateToExpression(state?: AvatarState): AvatarExpression {
  switch (state) {
    case 'listening':
      return 'listening'
    case 'thinking':
      return 'thinking'
    case 'talking':
      return 'teaching'
    case 'happy':
      return 'happy'
    case 'confused':
      return 'confused'
    case 'celebrating':
      return 'celebrating'
    default:
      return 'idle'
  }
}

/** Resolve the final expression from explicit prop or legacy inputs. */
export function resolveAvatarExpression(input: {
  expression?: AvatarExpression
  state?: AvatarState
  legacyExpression?: ExpressionState
}): AvatarExpression {
  if (input.expression !== undefined) {
    return input.expression
  }
  if (input.state !== undefined) {
    return avatarStateToExpression(input.state)
  }
  return expressionToAvatarExpression(input.legacyExpression)
}
