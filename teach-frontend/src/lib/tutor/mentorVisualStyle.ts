import type { CSSProperties } from 'react'
import type { MentorDefinition } from '../../types/mentor.types'

/** Mentor theme tokens for layout shells around NovaTutor. */
export function mentorVisualStyle(mentor: MentorDefinition): CSSProperties {
  return {
    '--mentor-accent': mentor.visual.accent,
    '--mentor-accent-soft': mentor.visual.accentSoft,
    '--mentor-glow': mentor.visual.glow,
    '--mentor-skin': mentor.visual.skin,
    '--mentor-secondary': mentor.visual.secondary,
  } as CSSProperties
}
