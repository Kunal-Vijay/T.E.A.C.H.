import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardCheck,
  Lightbulb,
  MessageCircleQuestion,
  Mic,
  Target,
} from 'lucide-react'

export type HeroCardVariant =
  | 'narration'
  | 'lesson'
  | 'adaptive'
  | 'question'
  | 'quiz'
  | 'progress'
  | 'path'
  | 'explain'

export interface HeroFloatCardConfig {
  id: string
  icon: LucideIcon
  title: string
  variant: HeroCardVariant
  /** Degrees clockwise from top — cards avoid 235°–305° (face cone). */
  angle: number
  radiusPx: number
  tilt: number
  floatDelay: number
  elevation: 1 | 2 | 3
  quote?: string
  lessonTitle?: string
  chips?: string[]
  body?: string
  progress?: number
}

/** Hero scene geometry — cards orbit outside Nova's face silhouette. */
export const HERO_SCENE_SIZE = 640
export const HERO_NOVA_SAFE_RADIUS_PX = 124

/** Contextual AI capability cards orbiting Nova. */
export const HERO_FLOAT_CARDS: HeroFloatCardConfig[] = [
  {
    id: 'narration',
    icon: Mic,
    title: 'Live Narration',
    variant: 'narration',
    angle: 16,
    radiusPx: 268,
    tilt: -2,
    floatDelay: 0,
    elevation: 2,
    quote: '"What happens when you push a chair?"',
  },
  {
    id: 'lesson',
    icon: BookOpen,
    title: 'Lesson Board',
    variant: 'lesson',
    angle: 54,
    radiusPx: 280,
    tilt: 1.5,
    floatDelay: 0.55,
    elevation: 1,
    lessonTitle: 'Introduction to Force',
    chips: ['Push', 'Pull', 'Motion'],
  },
  {
    id: 'adaptive',
    icon: Brain,
    title: 'Adaptive Learning',
    variant: 'adaptive',
    angle: 92,
    radiusPx: 287,
    tilt: -1,
    floatDelay: 1.05,
    elevation: 2,
    body: 'Pace adjusted · reviewing friction next',
  },
  {
    id: 'question',
    icon: MessageCircleQuestion,
    title: 'Student Question',
    variant: 'question',
    angle: 132,
    radiusPx: 276,
    tilt: 2,
    floatDelay: 0.25,
    elevation: 3,
    quote: 'Why does the ball slow down?',
  },
  {
    id: 'quiz',
    icon: ClipboardCheck,
    title: 'Quiz Ready',
    variant: 'quiz',
    angle: 172,
    radiusPx: 269,
    tilt: -1.5,
    floatDelay: 0.85,
    elevation: 1,
    body: '3 adaptive questions generated',
  },
  {
    id: 'progress',
    icon: BarChart3,
    title: 'Progress',
    variant: 'progress',
    angle: 212,
    radiusPx: 262,
    tilt: 1,
    floatDelay: 1.35,
    elevation: 2,
    progress: 87,
    body: 'lesson mastery',
  },
  {
    id: 'path',
    icon: Target,
    title: 'Personalized Path',
    variant: 'path',
    angle: 328,
    radiusPx: 266,
    tilt: -2,
    floatDelay: 0.45,
    elevation: 1,
    body: 'Next: Newton’s First Law',
  },
  {
    id: 'explain',
    icon: Lightbulb,
    title: 'Instant Explanations',
    variant: 'explain',
    angle: 246,
    radiusPx: 257,
    tilt: 1.5,
    floatDelay: 1.15,
    elevation: 1,
    quote: 'Friction converts motion into heat energy.',
  },
]

export function polarPoint(
  angleDeg: number,
  radiusPx: number,
  sceneSize = HERO_SCENE_SIZE,
): { x: number; y: number } {
  const radiusPercent = (radiusPx / sceneSize) * 100
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: 50 + radiusPercent * Math.cos(rad),
    y: 50 + radiusPercent * Math.sin(rad),
  }
}
