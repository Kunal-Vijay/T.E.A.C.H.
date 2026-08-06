import type { CSSProperties } from 'react'
import {
  AvatarMachineProvider,
  useAvatarMachineOutputOptional,
} from '../avatar/AvatarMachineProvider'
import type { AvatarMachineInput } from '../avatar/AvatarMachineState'
import { machineStateToLegacyExpression } from '../avatar/AvatarMachineState'
import { Avatar } from '../avatar'
import { getMentorGifAsset } from '../../lib/mentors/mentorAssets'
import { getTutorAriaLabel } from '../../lib/tutor'
import type { ExpressionState, MentorDefinition } from '../../types/mentor.types'

export type { ExpressionState as MentorExpressionState }

interface StudyMentorAvatarProps {
  /** Current AI Tutor definition. */
  tutor?: MentorDefinition
  /** @deprecated Use `tutor` */
  mentor?: MentorDefinition
  expression?: ExpressionState
  /** Application signals for InteractiveAvatar state machine. */
  avatarInput?: AvatarMachineInput
  isTalking?: boolean
  caption?: string
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showGlow?: boolean
  ariaLabel?: string
}

function StudyMentorAvatarView({
  tutor,
  mentor,
  expression = 'idle',
  isTalking,
  caption,
  size = 'md',
  showGlow = true,
  ariaLabel,
}: StudyMentorAvatarProps) {
  const activeTutor = tutor ?? mentor!
  const asset = getMentorGifAsset(activeTutor.id)
  const machine = useAvatarMachineOutputOptional()
  const label = ariaLabel ?? getTutorAriaLabel()

  if (asset === null) {
    return null
  }

  const resolvedExpression = machine !== null
    ? machineStateToLegacyExpression(machine.state)
    : expression
  const showCelebration = resolvedExpression === 'celebrating' || resolvedExpression === 'excited'
  const showSpeaking = machine?.isTalking ?? isTalking ?? (expression === 'speaking' || expression === 'explaining')
  const showListening = resolvedExpression === 'listening' || resolvedExpression === 'curious'
  const showThinking = resolvedExpression === 'thinking'

  return (
    <div
      className={`study-mentor study-mentor-${size} study-mentor-${activeTutor.id} study-mentor-has-gif mentor-expr-${resolvedExpression}${showGlow ? ' has-glow' : ''}`}
      style={{
        '--mentor-accent': activeTutor.visual.accent,
        '--mentor-accent-soft': activeTutor.visual.accentSoft,
        '--mentor-glow': activeTutor.visual.glow,
        '--mentor-skin': activeTutor.visual.skin,
        '--mentor-secondary': activeTutor.visual.secondary,
      } as CSSProperties}
      role="figure"
      aria-label={label}
      data-tutor-id={activeTutor.id}
      data-avatar-state={machine?.state}
    >
      <div className="study-mentor-stage">
        <Avatar
          mentorId={activeTutor.id}
          asset={asset}
          label={label}
          expression={expression}
          isTalking={showSpeaking}
        />
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

export default function StudyMentorAvatar({ avatarInput, tutor, mentor, ...props }: StudyMentorAvatarProps) {
  const resolvedTutor = tutor ?? mentor
  if (resolvedTutor === undefined) {
    return null
  }

  if (avatarInput !== undefined) {
    return (
      <AvatarMachineProvider input={avatarInput}>
        <StudyMentorAvatarView {...props} tutor={resolvedTutor} avatarInput={avatarInput} />
      </AvatarMachineProvider>
    )
  }

  return <StudyMentorAvatarView {...props} tutor={resolvedTutor} />
}
