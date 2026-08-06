export type PhonemeId = 'A' | 'E' | 'O' | 'M'

export interface PhonemeShape {
  id: PhonemeId
  scaleX: number
  scaleY: number
  curve: number
}

/** Distinct mouth poses — not simple open/close. */
export const PHONEME_SHAPES: Record<PhonemeId, PhonemeShape> = {
  A: { id: 'A', scaleX: 1.2, scaleY: 1.48, curve: -3 },
  E: { id: 'E', scaleX: 1.1, scaleY: 0.92, curve: 1.5 },
  O: { id: 'O', scaleX: 0.78, scaleY: 1.26, curve: 5 },
  M: { id: 'M', scaleX: 0.68, scaleY: 0.26, curve: 0 },
}

export const PHONEME_SEQUENCE: PhonemeId[] = ['A', 'E', 'O', 'M']

export const NEUTRAL_MOUTH = {
  scaleX: 1,
  scaleY: 1,
  curve: 0,
} as const

export const NEUTRAL_TALK_POSE = {
  headRotate: 0,
  headY: 0,
  browLeftY: 0,
  browRightY: 0,
  browLeftRotate: 0,
  browRightRotate: 0,
  eyeX: 0,
  eyeY: 0,
  bodyScale: 1,
} as const
