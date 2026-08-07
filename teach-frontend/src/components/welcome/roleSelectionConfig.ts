import type { LucideIcon } from 'lucide-react'
import { GraduationCap } from 'lucide-react'
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
    headline: "Let's Go",
    subtitle: "Enter Nova's live classroom.",
    icon: GraduationCap,
    capabilities: [
      { label: 'Learn with Nova' },
      { label: 'Voice Lessons' },
      { label: 'Instant Doubts' },
    ],
  },
]

export const ROLE_IDS = ROLE_DEFINITIONS.map((role) => role.id)
