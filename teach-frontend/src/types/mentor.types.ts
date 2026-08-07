/** Official AI Tutor id — extend here when adding future tutors. */
export type TutorId = 'nova'

/** @deprecated Use TutorId */
export type MentorId = TutorId

export type ExpressionState =
  | 'idle'
  | 'blink'
  | 'smile'
  | 'laugh'
  | 'happy'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'explaining'
  | 'curious'
  | 'confused'
  | 'encouraging'
  | 'proud'
  | 'excited'
  | 'celebrating'
  | 'concerned'
  | 'sleeping'

export type EmotionState = ExpressionState

export type ThinkingEffect =
  | 'look-up'
  | 'eyes-closed'
  | 'spin'
  | 'dot-matrix'
  | 'telescope'
  | 'doodle'

export type IdleMotion = 'bounce' | 'breathe-slow' | 'float-spin' | 'glow-pulse' | 'nod-subtle' | 'cube-tilt' | 'star-drift' | 'tail-sway'

export type CelebrateMotion = 'jump-clap' | 'slow-nod' | 'spin-flash' | 'warm-glow' | 'glasses-adjust' | 'pixel-burst' | 'star-burst' | 'fox-hop'

export type AnimationIntensity = 'full' | 'reduced' | 'minimal'

export interface MentorPersonality {
  traits: string[]
  speakingStyle: string
  energy: 'low' | 'medium' | 'high' | 'very-high'
  warmth: 'cool' | 'neutral' | 'warm' | 'very-warm'
  humor: 'none' | 'light' | 'playful' | 'witty'
  vocabulary: 'casual' | 'professional' | 'technical' | 'poetic' | 'concise' | 'story-driven'
}

export interface VoiceProfile {
  rate: number
  pitch: number
  volume: number
  pauseBeforeMs: number
  pauseBetweenMs: number
  /** Max characters per TTS chunk when chunkSpeech is enabled */
  maxCharsPerChunk: number
  chunkSpeech: boolean
  energy: MentorPersonality['energy']
  warmth: MentorPersonality['warmth']
  humor: MentorPersonality['humor']
  vocabulary: MentorPersonality['vocabulary']
}

export interface AnimationProfile {
  idle: IdleMotion
  thinking: ThinkingEffect
  celebrating: CelebrateMotion
  speaking: 'talk-bounce' | 'talk-steady' | 'talk-buzz' | 'talk-soft' | 'talk-precise' | 'talk-glitch' | 'talk-wonder' | 'talk-expressive'
  blinkMinMs: number
  blinkMaxMs: number
  posture: 'upright-bouncy' | 'grounded-calm' | 'floating' | 'soft-relaxed' | 'professional' | 'geometric' | 'explorer' | 'creative-tilt'
}

export type DialogueCategory =
  | 'greetings'
  | 'demoLines'
  | 'lessonIntros'
  | 'celebrations'
  | 'encouragements'
  | 'hints'
  | 'goodbyes'
  | 'retries'
  | 'quizCorrect'
  | 'quizWrong'
  | 'lessonComplete'
  | 'streakExcited'
  | 'welcomeBack'
  | 'thinking'
  | 'listening'
  | 'explaining'
  | 'curious'
  | 'proud'

export interface DialogueProfile {
  greetings: readonly string[]
  demoLines: readonly string[]
  lessonIntros: readonly string[]
  celebrations: readonly string[]
  encouragements: readonly string[]
  hints: readonly string[]
  goodbyes: readonly string[]
  retries: readonly string[]
  quizCorrect: readonly string[]
  quizWrong: readonly string[]
  lessonComplete: readonly string[]
  streakExcited: readonly string[]
  welcomeBack: readonly string[]
  thinking: readonly string[]
  listening: readonly string[]
  explaining: readonly string[]
  curious: readonly string[]
  proud: readonly string[]
}

export interface ExpressionProfile {
  onSpeak: ExpressionState
  onListen: ExpressionState
  onThink: ExpressionState
  onCelebrate: ExpressionState
  onEncourage: ExpressionState
  onExplain: ExpressionState
  onIdle: ExpressionState
}

export interface BehaviorProfile {
  chunkSpeech: boolean
  playLessonIntro: boolean
  /** 0–1 probability of speaking a lesson intro before slide content */
  lessonIntroChance: number
  defaultAnimationIntensity: AnimationIntensity
}

export interface VisualProfile {
  shape: TutorId
  accent: string
  accentSoft: string
  glow: string
  skin: string
  secondary: string
}

export interface MentorDefinition {
  id: TutorId
  name: string
  tagline: string
  teachingStyle: string
  bestSubjects: string[]
  personality: MentorPersonality
  visual: VisualProfile
  voice: VoiceProfile
  animation: AnimationProfile
  dialogue: DialogueProfile
  expression: ExpressionProfile
  behavior: BehaviorProfile
}

/** @deprecated Use MentorDefinition — tutor profile shape */
export type TutorDefinition = MentorDefinition

export interface MentorProfile {
  mentorId: TutorId
  selectedAt: number
  studentName?: string
}

export type ClassroomAvatarMode = 'idle' | 'speaking' | 'listening' | 'questioning'

/** @deprecated Use DialogueCategory */
export type DialogueKey = DialogueCategory
