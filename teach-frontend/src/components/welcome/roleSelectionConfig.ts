import type { LucideIcon } from 'lucide-react'
import { GraduationCap, Presentation } from 'lucide-react'
import type { AppRole } from '../../services/auth/authService'

export interface RoleCapability {
  label: string
}

export interface RoleDefinition {
  id: AppRole
  headline: string
  subtitle: string
  icon: LucideIcon
  capabilities: RoleCapability[]
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'student',
    headline: 'Student',
    subtitle: 'Learn with your AI Tutor.',
    icon: GraduationCap,
    capabilities: [
      { label: 'Voice Lessons' },
      { label: 'Interactive Quizzes' },
      { label: 'Ask Doubts' },
    ],
  },
  {
    id: 'teacher',
    headline: 'Teacher',
    subtitle: 'Create AI classrooms.',
    icon: Presentation,
    capabilities: [
      { label: 'Generate Lessons' },
      { label: 'Publish Classes' },
      { label: 'Review Content' },
    ],
  },
]

export const ROLE_IDS = ROLE_DEFINITIONS.map((role) => role.id)
