import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  AVATAR_EXPRESSION_POSES,
  type AvatarExpression,
  type AvatarExpressionPose,
} from './AvatarExpression'
import { randomBetween } from './avatarIdleRandom'

/** Spring tuned for ~300–600ms expression cross-fades. */
function expressionSpringTransition() {
  return {
    type: 'spring' as const,
    stiffness: randomBetween(190, 260),
    damping: randomBetween(22, 28),
    mass: randomBetween(0.82, 0.95),
    restDelta: 0.001,
  }
}

export interface AvatarExpressionMotion {
  eyeScaleY: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  browLeftY: MotionValue<number>
  browRightY: MotionValue<number>
  browLeftRotate: MotionValue<number>
  browRightRotate: MotionValue<number>
  mouthScaleX: MotionValue<number>
  mouthScaleY: MotionValue<number>
  mouthCurve: MotionValue<number>
  mouthOpacity: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  bodyScale: MotionValue<number>
  figureY: MotionValue<number>
  handLeftRotate: MotionValue<number>
  handLeftY: MotionValue<number>
  handRightRotate: MotionValue<number>
  handRightY: MotionValue<number>
  rootY: MotionValue<number>
  rootScale: MotionValue<number>
  glowOpacity: MotionValue<number>
  glowScale: MotionValue<number>
}

const POSE_KEYS = Object.keys(AVATAR_EXPRESSION_POSES.idle) as (keyof AvatarExpressionPose)[]

function applyPose(
  motion: AvatarExpressionMotion,
  pose: AvatarExpressionPose,
  instant: boolean,
): void {
  const transition = instant ? { duration: 0 } : expressionSpringTransition()

  for (const key of POSE_KEYS) {
    void animate(motion[key], pose[key], transition)
  }
}

/**
 * Springs the avatar toward an expression pose.
 * Blends smoothly over ~300–600ms; idle/talk layers stack on top.
 */
export function useAvatarExpressionEngine(expression: AvatarExpression): AvatarExpressionMotion {
  const reduceMotion = useReducedMotion()
  const initialPose = AVATAR_EXPRESSION_POSES[expression]

  const eyeScaleY = useMotionValue(initialPose.eyeScaleY)
  const eyeX = useMotionValue(initialPose.eyeX)
  const eyeY = useMotionValue(initialPose.eyeY)
  const browLeftY = useMotionValue(initialPose.browLeftY)
  const browRightY = useMotionValue(initialPose.browRightY)
  const browLeftRotate = useMotionValue(initialPose.browLeftRotate)
  const browRightRotate = useMotionValue(initialPose.browRightRotate)
  const mouthScaleX = useMotionValue(initialPose.mouthScaleX)
  const mouthScaleY = useMotionValue(initialPose.mouthScaleY)
  const mouthCurve = useMotionValue(initialPose.mouthCurve)
  const mouthOpacity = useMotionValue(initialPose.mouthOpacity)
  const headRotate = useMotionValue(initialPose.headRotate)
  const headY = useMotionValue(initialPose.headY)
  const bodyScale = useMotionValue(initialPose.bodyScale)
  const figureY = useMotionValue(initialPose.figureY)
  const handLeftRotate = useMotionValue(initialPose.handLeftRotate)
  const handLeftY = useMotionValue(initialPose.handLeftY)
  const handRightRotate = useMotionValue(initialPose.handRightRotate)
  const handRightY = useMotionValue(initialPose.handRightY)
  const rootY = useMotionValue(initialPose.rootY)
  const rootScale = useMotionValue(initialPose.rootScale)
  const glowOpacity = useMotionValue(initialPose.glowOpacity)
  const glowScale = useMotionValue(initialPose.glowScale)

  const motionRef = useRef<AvatarExpressionMotion>({
    eyeScaleY,
    eyeX,
    eyeY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    mouthOpacity,
    headRotate,
    headY,
    bodyScale,
    figureY,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    rootY,
    rootScale,
    glowOpacity,
    glowScale,
  })

  motionRef.current = {
    eyeScaleY,
    eyeX,
    eyeY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    mouthOpacity,
    headRotate,
    headY,
    bodyScale,
    figureY,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    rootY,
    rootScale,
    glowOpacity,
    glowScale,
  }

  useEffect(() => {
    const pose = AVATAR_EXPRESSION_POSES[expression]
    applyPose(motionRef.current, pose, reduceMotion === true)
  }, [expression, reduceMotion])

  return motionRef.current
}
