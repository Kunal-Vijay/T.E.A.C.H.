import type { BehaviorProfile, ExpressionProfile } from '../../types/mentor.types'

export const DEFAULT_EXPRESSION: ExpressionProfile = {
  onSpeak: 'speaking',
  onListen: 'listening',
  onThink: 'thinking',
  onCelebrate: 'celebrating',
  onEncourage: 'encouraging',
  onExplain: 'explaining',
  onIdle: 'idle',
}

export const DEFAULT_BEHAVIOR: BehaviorProfile = {
  chunkSpeech: true,
  playLessonIntro: true,
  lessonIntroChance: 0.4,
  defaultAnimationIntensity: 'full',
}

export function mentorBehavior(overrides: Partial<BehaviorProfile>): BehaviorProfile {
  return { ...DEFAULT_BEHAVIOR, ...overrides }
}

export function mentorExpression(overrides: Partial<ExpressionProfile>): ExpressionProfile {
  return { ...DEFAULT_EXPRESSION, ...overrides }
}
