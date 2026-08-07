import type { MentorDefinition, TutorId } from '../../../types/mentor.types'
import { MENTOR_DIALOGUES } from '../dialogueLibraries'
import { mentorBehavior, mentorExpression } from '../mentorDefaults'

const visual = (
  shape: TutorId,
): MentorDefinition['visual'] => ({
  shape,
  accent: `var(--mentor-${shape}-accent)`,
  accentSoft: `var(--mentor-${shape}-soft)`,
  glow: `var(--mentor-${shape}-glow)`,
  skin: `var(--mentor-${shape}-skin)`,
  secondary: `var(--mentor-${shape}-secondary)`,
})

function defineTutor(
  id: TutorId,
  config: Omit<MentorDefinition, 'id' | 'dialogue' | 'expression' | 'behavior'>,
  behaviorOverrides?: Parameters<typeof mentorBehavior>[0],
  expressionOverrides?: Parameters<typeof mentorExpression>[0],
): MentorDefinition {
  return {
    id,
    ...config,
    dialogue: MENTOR_DIALOGUES[id],
    behavior: mentorBehavior(behaviorOverrides ?? {}),
    expression: mentorExpression(expressionOverrides ?? {}),
  }
}

/** Registry of tutor definitions — Nova is the official AI Tutor. */
export const MENTOR_CONFIGS: MentorDefinition[] = [
  defineTutor('nova', {
    name: 'Nova',
    tagline: 'Live lessons, your pace',
    teachingStyle: 'Warm, energetic coaching — clear steps, momentum, and encouragement',
    bestSubjects: ['Math', 'Physics', 'General Science', 'Exam Prep'],
    personality: {
      traits: ['Friendly', 'Optimistic', 'Patient'],
      speakingStyle: 'Clear, upbeat, and supportive — never rushed',
      energy: 'high',
      warmth: 'very-warm',
      humor: 'light',
      vocabulary: 'casual',
    },
    visual: visual('nova'),
    voice: {
      rate: 1.08,
      pitch: 1.08,
      volume: 1,
      pauseBeforeMs: 100,
      pauseBetweenMs: 440,
      maxCharsPerChunk: 110,
      chunkSpeech: true,
      energy: 'high',
      warmth: 'very-warm',
      humor: 'light',
      vocabulary: 'casual',
    },
    animation: {
      idle: 'bounce',
      thinking: 'look-up',
      celebrating: 'jump-clap',
      speaking: 'talk-bounce',
      blinkMinMs: 2200,
      blinkMaxMs: 4800,
      posture: 'upright-bouncy',
    },
  }, { lessonIntroChance: 0.55 }, { onCelebrate: 'excited', onEncourage: 'smile' }),
]

export const MENTOR_CATALOG: Record<TutorId, MentorDefinition> = Object.fromEntries(
  MENTOR_CONFIGS.map((m) => [m.id, m]),
) as Record<TutorId, MentorDefinition>
