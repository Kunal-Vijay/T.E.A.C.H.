import { Component, type CSSProperties, type ReactNode } from 'react'
import type { MentorGifAsset } from '../../lib/mentors/mentorAssets'
import type { ExpressionState, MentorId } from '../../types/mentor.types'
import { useAvatarMode } from './AvatarProvider'
import { useAvatarMachineOutputOptional } from './AvatarMachineProvider'
import type { AvatarExpression } from './AvatarExpression'
import { resolveAvatarExpression } from './AvatarExpression'
import type { AvatarState } from './AvatarState'
import GifAvatar from './GifAvatar'
import InteractiveAvatar from './InteractiveAvatar'

export interface AvatarProps {
  mentorId: MentorId
  asset: MentorGifAsset
  label: string
  /** Interactive expression — canonical when using InteractiveAvatar. */
  avatarExpression?: AvatarExpression
  /** @deprecated Use `avatarExpression`. Legacy animation state. */
  state?: AvatarState
  /** @deprecated Use `avatarExpression`. Legacy mentor expression mapping. */
  expression?: ExpressionState
  /** Drives phoneme speech on InteractiveAvatar only; GIF ignores this. */
  isTalking?: boolean
  className?: string
  style?: CSSProperties
}

interface AvatarErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface AvatarErrorBoundaryState {
  hasError: boolean
}

class AvatarErrorBoundary extends Component<AvatarErrorBoundaryProps, AvatarErrorBoundaryState> {
  state: AvatarErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AvatarErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * Reusable avatar — GIF by default; InteractiveAvatar when feature flag is enabled.
 * Always falls back to the GIF on interactive render failure.
 * Purely state-driven: pass `avatarExpression` / `isTalking` from parent logic.
 */
export default function Avatar({
  mentorId,
  asset,
  label,
  avatarExpression,
  state,
  expression,
  isTalking,
  className,
  style,
}: AvatarProps) {
  const { useInteractiveAvatar } = useAvatarMode()
  const machine = useAvatarMachineOutputOptional()
  const resolvedExpression = useInteractiveAvatar && machine !== null
    ? machine.expression
    : resolveAvatarExpression({
      expression: avatarExpression,
      state,
      legacyExpression: expression,
    })
  const resolvedIsTalking = useInteractiveAvatar && machine !== null
    ? machine.isTalking
    : (isTalking ?? (
      expression === 'speaking'
      || expression === 'explaining'
      || resolvedExpression === 'teaching'
    ))

  const gifFallback = (
    <GifAvatar
      mentorId={mentorId}
      asset={asset}
      label={label}
      className={className}
      style={style}
    />
  )

  if (!useInteractiveAvatar) {
    return gifFallback
  }

  return (
    <AvatarErrorBoundary fallback={gifFallback}>
      <InteractiveAvatar
        mentorId={mentorId}
        label={label}
        expression={resolvedExpression}
        isTalking={resolvedIsTalking}
        className={className}
        style={style}
      />
    </AvatarErrorBoundary>
  )
}

export { expressionToAvatarState } from './AvatarState'
export {
  AVATAR_EXPRESSIONS,
  AVATAR_EXPRESSION_POSES,
  avatarStateToExpression,
  expressionToAvatarExpression,
  resolveAvatarExpression,
  type AvatarExpression,
  type AvatarExpressionPose,
} from './AvatarExpression'
export type { AvatarState }
