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

/** Contextual classroom cards orbiting the AI Tutor. */
export const HERO_FLOAT_CARDS: HeroFloatCardConfig[] = [
  {
    id: 'narration',
    icon: Mic,
    title: 'Live Narration',
    variant: 'narration',
    angle: -12,
    radiusPx: 198,
    tilt: -2.5,
    floatDelay: 0,
    elevation: 3,
    quote: '"What happens when you push a chair?"',
  },
  {
    id: 'lesson',
    icon: BookOpen,
    title: 'Lesson Board',
    variant: 'lesson',
    angle: 38,
    radiusPx: 218,
    tilt: 1.5,
    floatDelay: 0.6,
    elevation: 2,
    lessonTitle: 'Introduction to Force',
    chips: ['Push', 'Pull', 'Motion'],
  },
  {
    id: 'adaptive',
    icon: Brain,
    title: 'Adaptive Learning',
    variant: 'adaptive',
    angle: 82,
    radiusPx: 188,
    tilt: -1,
    floatDelay: 1.1,
    elevation: 1,
    body: 'Pace adjusted · reviewing friction next',
  },
  {
    id: 'question',
    icon: MessageCircleQuestion,
    title: 'Student Question',
    variant: 'question',
    angle: 128,
    radiusPx: 208,
    tilt: 2,
    floatDelay: 0.3,
    elevation: 2,
    quote: 'Why does the ball slow down?',
  },
  {
    id: 'quiz',
    icon: ClipboardCheck,
    title: 'Quiz Ready',
    variant: 'quiz',
    angle: 168,
    radiusPx: 192,
    tilt: -1.5,
    floatDelay: 0.9,
    elevation: 2,
    body: '3 adaptive questions generated',
  },
  {
    id: 'progress',
    icon: BarChart3,
    title: 'Progress',
    variant: 'progress',
    angle: 212,
    radiusPx: 212,
    tilt: 1,
    floatDelay: 1.4,
    elevation: 1,
    progress: 87,
    body: 'lesson mastery',
  },
  {
    id: 'path',
    icon: Target,
    title: 'Personalized Path',
    variant: 'path',
    angle: 258,
    radiusPx: 202,
    tilt: -2,
    floatDelay: 0.5,
    elevation: 2,
    body: 'Next: Newton’s First Law · 8 min',
  },
  {
    id: 'explain',
    icon: Lightbulb,
    title: 'Instant Explanations',
    variant: 'explain',
    angle: 302,
    radiusPx: 198,
    tilt: 1.8,
    floatDelay: 1.2,
    elevation: 3,
    quote: 'Friction converts motion into heat energy.',
  },
]

export function polarPoint(angleDeg: number, radiusPx: number, sceneSize = 480): { x: number; y: number } {
  const radiusPercent = (radiusPx / sceneSize) * 50
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: 50 + radiusPercent * Math.cos(rad),
    y: 50 + radiusPercent * Math.sin(rad),
  }
}
