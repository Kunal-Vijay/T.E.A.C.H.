import type { CSSProperties } from 'react'
import { getMentorGifAsset } from '../../lib/mentors/mentorAssets'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'
import MentorGifAvatar from './MentorGifAvatar'

export type { ExpressionState as MentorExpressionState }

interface StudyMentorAvatarProps {
  mentor: MentorDefinition
  expression?: ExpressionState
  caption?: string
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showGlow?: boolean
  ariaLabel?: string
}

export default function StudyMentorAvatar({
  mentor,
  expression = 'idle',
  caption,
  size = 'md',
  showGlow = true,
  ariaLabel,
}: StudyMentorAvatarProps) {
  const asset = getMentorGifAsset(mentor.id)
  const label = ariaLabel ?? `${mentor.name}, your AI Tutor`

  if (asset === null) {
    return null
  }

  const showCelebration = expression === 'celebrating' || expression === 'excited'
  const showSpeaking = expression === 'speaking' || expression === 'explaining'
  const showListening = expression === 'listening' || expression === 'curious'
  const showThinking = expression === 'thinking'

  return (
    <div
      className={`study-mentor study-mentor-${size} study-mentor-${mentor.id} study-mentor-has-gif mentor-expr-${expression}${showGlow ? ' has-glow' : ''}`}
      style={{
        '--mentor-accent': mentor.visual.accent,
        '--mentor-accent-soft': mentor.visual.accentSoft,
        '--mentor-glow': mentor.visual.glow,
        '--mentor-skin': mentor.visual.skin,
        '--mentor-secondary': mentor.visual.secondary,
      } as CSSProperties}
      role="figure"
      aria-label={label}
      data-mentor-id={mentor.id}
    >
      <div className="study-mentor-stage">
        <MentorGifAvatar mentorId={mentor.id} asset={asset} label={label} />
        {showCelebration ? (
          <>
            <span className="mentor-confetti mentor-confetti-a" aria-hidden="true" />
            <span className="mentor-confetti mentor-confetti-b" aria-hidden="true" />
            <span className="mentor-confetti mentor-confetti-c" aria-hidden="true" />
          </>
        ) : null}
        {showSpeaking ? (
          <span className="mentor-speak-ring" aria-hidden="true" />
        ) : null}
        {showListening ? (
          <span className="mentor-listen-ring" aria-hidden="true" />
        ) : null}
        {showThinking ? (
          <span className="mentor-think-pulse" aria-hidden="true" />
        ) : null}
      </div>
      {caption !== undefined && caption !== '' ? (
        <p className="study-mentor-caption">{caption}</p>
      ) : null}
    </div>
  )
}
