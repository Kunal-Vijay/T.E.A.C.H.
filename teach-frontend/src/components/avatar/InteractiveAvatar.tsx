import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { memo, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import type { MentorId } from '../../types/mentor.types'
import { avatarThemeToStyle, type AvatarCharacterId } from './AvatarConfig'
import type { AvatarExpression } from './AvatarExpression'
import { useAvatarConfig } from './AvatarProvider'
import { useAvatarMachineOutputOptional } from './AvatarMachineProvider'
import { useAvatarGestureMotionOptional } from './AvatarGestureProvider'
import {
  InteractiveAvatarAmbient,
  InteractiveAvatarBody,
  InteractiveAvatarDecorations,
  InteractiveAvatarFace,
} from './InteractiveAvatarLayers'
import { useAvatarExpressionEngine } from './useAvatarExpressionEngine'
import { useAvatarIdleLife } from './useAvatarIdleLife'
import { useAvatarMouseTrack } from './useAvatarMouseTrack'
import { useInteractiveAvatarMotion } from './useInteractiveAvatarMotion'
import { useAvatarTalking } from './useAvatarTalking'

export interface InteractiveAvatarProps {
  mentorId: MentorId
  label: string
  expression?: AvatarExpression
  isTalking?: boolean
  /** Override global AvatarProvider character for this instance. */
  characterId?: AvatarCharacterId
  className?: string
  style?: CSSProperties
}

/** GPU-accelerated procedural tutor avatar — config-driven, single component. */
function InteractiveAvatarInner({
  mentorId,
  label,
  expression = 'idle',
  isTalking = false,
  className,
  style,
}: InteractiveAvatarProps) {
  const config = useAvatarConfig(mentorId)
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const machine = useAvatarMachineOutputOptional()
  const expr = useAvatarExpressionEngine(expression)
  const companionEnabled = reduceMotion !== true
  const idleMicro = expression === 'idle' && !isTalking
  const life = useAvatarIdleLife(companionEnabled, {
    companion: true,
    animateMouth: !isTalking,
    microMovements: idleMicro,
  })
  const mouse = useAvatarMouseTrack(companionEnabled && !isTalking, containerRef)
  const talk = useAvatarTalking(isTalking && reduceMotion !== true)

  const gestureHandLeftRotate = useMotionValue(0)
  const gestureHandLeftY = useMotionValue(0)
  const gestureHandRightRotate = useMotionValue(0)
  const gestureHandRightY = useMotionValue(0)
  const gestureHeadRotate = useMotionValue(0)
  const gestureHeadY = useMotionValue(0)
  const gestureFigureY = useMotionValue(0)
  const gestureBodyScale = useMotionValue(1)

  const gestureFromProvider = useAvatarGestureMotionOptional()
  const gesture = useMemo(
    () => gestureFromProvider ?? {
      handLeftRotate: gestureHandLeftRotate,
      handLeftY: gestureHandLeftY,
      handRightRotate: gestureHandRightRotate,
      handRightY: gestureHandRightY,
      headRotate: gestureHeadRotate,
      headY: gestureHeadY,
      figureY: gestureFigureY,
      bodyScale: gestureBodyScale,
    },
    [
      gestureFromProvider,
      gestureHandLeftRotate,
      gestureHandLeftY,
      gestureHandRightRotate,
      gestureHandRightY,
      gestureHeadRotate,
      gestureHeadY,
      gestureFigureY,
      gestureBodyScale,
    ],
  )

  const avatarMotion = useInteractiveAvatarMotion({ expr, life, talk, mouse, gesture })
  const themeStyle = useMemo(() => avatarThemeToStyle(config.theme), [config.theme])

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'interactive-avatar',
        'interactive-avatar--companion',
        'mentor-gif-avatar',
        `mentor-gif-${mentorId}`,
        `interactive-avatar--char-${config.id}`,
        `interactive-avatar--expr-${expression}`,
        isTalking && 'interactive-avatar--talking',
        className,
      )}
      style={{ y: avatarMotion.rootY, scale: expr.rootScale, ...themeStyle, ...style }}
      role="img"
      aria-label={label}
      data-expression={expression}
      data-avatar-state={machine?.state}
      data-avatar-character={config.id}
      data-avatar-name={config.name}
      initial={false}
    >
      <InteractiveAvatarAmbient
        glowOpacity={avatarMotion.glowOpacity}
        glowScale={avatarMotion.glowScale}
        ambientOpacity={avatarMotion.ambientOpacity}
        ambientScale={avatarMotion.ambientScale}
        shadowScale={avatarMotion.shadowScale}
        shadowOpacity={avatarMotion.shadowOpacity}
      />

      <img
        className="interactive-avatar-silhouette"
        src={config.assets.silhouette}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <motion.div
        className="interactive-avatar-figure"
        aria-hidden="true"
        style={{ y: avatarMotion.figureY, x: avatarMotion.bodyShiftX }}
        initial={false}
      >
        <InteractiveAvatarFace
          eyeScaleY={avatarMotion.eyeScaleY}
          eyeX={avatarMotion.eyeX}
          eyeY={avatarMotion.eyeY}
          highlightY={avatarMotion.highlightY}
          browLeftY={avatarMotion.browLeftY}
          browRightY={avatarMotion.browRightY}
          browLeftRotate={avatarMotion.browLeftRotate}
          browRightRotate={avatarMotion.browRightRotate}
          mouthScaleX={avatarMotion.mouthScaleX}
          mouthScaleY={avatarMotion.mouthScaleY}
          mouthCurve={avatarMotion.mouthCurve}
          mouthOpacity={expr.mouthOpacity}
          cheekFlush={avatarMotion.cheekFlush}
          headRotate={avatarMotion.headRotate}
          headY={avatarMotion.headY}
        />

        <InteractiveAvatarBody
          hair={config.hair}
          clothing={config.clothing}
          hairY={avatarMotion.hairY}
          hairRotate={avatarMotion.hairRotate}
          bodyScale={avatarMotion.bodyScale}
          shoulderLeftRotate={avatarMotion.shoulderLeftRotate}
          shoulderRightRotate={avatarMotion.shoulderRightRotate}
          handLeftRotate={avatarMotion.handLeftRotate}
          handLeftY={avatarMotion.handLeftY}
          handRightRotate={avatarMotion.handRightRotate}
          handRightY={avatarMotion.handRightY}
        />
      </motion.div>

      <InteractiveAvatarDecorations />
    </motion.div>
  )
}

const InteractiveAvatar = memo(InteractiveAvatarInner)
InteractiveAvatar.displayName = 'InteractiveAvatar'

export default InteractiveAvatar
