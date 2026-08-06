import { useTransform, type MotionValue } from 'framer-motion'
import {
  useAddMotion,
  useAddQuadrupleMotion,
  useAddTripleMotion,
  useMultiplyQuadrupleMotion,
  useMultiplyTripleMotion,
} from './useAvatarMotionBlend'
import type { AvatarExpressionMotion } from './useAvatarExpressionEngine'
import type { AvatarGestureMotion } from './useAvatarGestureEngine'
import type { AvatarIdleLifeMotion } from './useAvatarIdleLife'
import type { AvatarMouseTrackMotion } from './useAvatarMouseTrack'
import type { AvatarTalkMotion } from './useAvatarTalking'

export interface InteractiveAvatarMotionInput {
  expr: AvatarExpressionMotion
  life: AvatarIdleLifeMotion
  talk: AvatarTalkMotion
  mouse: AvatarMouseTrackMotion
  gesture: AvatarGestureMotion
}

export interface InteractiveAvatarMotionOutput {
  rootY: MotionValue<number>
  eyeScaleY: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  highlightY: MotionValue<number>
  browLeftY: MotionValue<number>
  browRightY: MotionValue<number>
  browLeftRotate: MotionValue<number>
  browRightRotate: MotionValue<number>
  mouthScaleX: MotionValue<number>
  mouthScaleY: MotionValue<number>
  mouthCurve: MotionValue<number>
  cheekFlush: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  figureY: MotionValue<number>
  bodyShiftX: MotionValue<number>
  bodyScale: MotionValue<number>
  shoulderLeftRotate: MotionValue<number>
  shoulderRightRotate: MotionValue<number>
  handLeftRotate: MotionValue<number>
  handLeftY: MotionValue<number>
  handRightRotate: MotionValue<number>
  handRightY: MotionValue<number>
  hairY: MotionValue<number>
  hairRotate: MotionValue<number>
  shadowScale: MotionValue<number>
  shadowOpacity: MotionValue<number>
  ambientOpacity: MotionValue<number>
  ambientScale: MotionValue<number>
  glowOpacity: MotionValue<number>
  glowScale: MotionValue<number>
}

/** Stable motion-value blends — isolated from React render churn. */
export function useInteractiveAvatarMotion({
  expr,
  life,
  talk,
  mouse,
  gesture,
}: InteractiveAvatarMotionInput): InteractiveAvatarMotionOutput {
  const eyeScaleY = useTransform(
    [expr.eyeScaleY, life.blink],
    ([base, blink]) => (base as number) * (blink as number),
  )

  const eyeXBase = useAddTripleMotion(expr.eyeX, life.eyeX, talk.eyeX)
  const eyeYBase = useAddTripleMotion(expr.eyeY, life.eyeY, talk.eyeY)
  const eyeX = useAddMotion(eyeXBase, mouse.lookX)
  const eyeY = useAddMotion(eyeYBase, mouse.lookY)

  const highlightY = useTransform(life.blink, (blink) => {
    const open = blink as number
    return open > 0.85 ? 0 : (1 - open) * 1.2
  })

  const browLeftY = useAddTripleMotion(expr.browLeftY, life.browLeftY, talk.browLeftY)
  const browRightY = useAddTripleMotion(expr.browRightY, life.browRightY, talk.browRightY)
  const browLeftRotate = useAddTripleMotion(expr.browLeftRotate, life.browLeftRotate, talk.browLeftRotate)
  const browRightRotate = useAddTripleMotion(expr.browRightRotate, life.browRightRotate, talk.browRightRotate)
  const mouthScaleX = useMultiplyTripleMotion(expr.mouthScaleX, life.mouthScaleX, talk.mouthScaleX)
  const mouthScaleY = useMultiplyTripleMotion(expr.mouthScaleY, life.mouthScaleY, talk.mouthScaleY)
  const mouthCurve = useAddTripleMotion(expr.mouthCurve, life.mouthCurve, talk.mouthCurve)
  const headRotate = useAddQuadrupleMotion(expr.headRotate, life.headRotate, talk.headRotate, gesture.headRotate)
  const headY = useAddQuadrupleMotion(expr.headY, life.headY, talk.headY, gesture.headY)
  const figureYBase = useAddMotion(expr.figureY, life.figureY)
  const figureY = useAddMotion(figureYBase, gesture.figureY)
  const bodyScale = useMultiplyQuadrupleMotion(
    expr.bodyScale,
    life.bodyScale,
    talk.bodyScale,
    gesture.bodyScale,
  )
  const handLeftRotateBase = useAddMotion(expr.handLeftRotate, life.handLeftRotate)
  const handLeftRotate = useAddMotion(handLeftRotateBase, gesture.handLeftRotate)
  const handLeftYBase = useAddMotion(expr.handLeftY, life.handLeftY)
  const handLeftY = useAddMotion(handLeftYBase, gesture.handLeftY)
  const handRightRotateBase = useAddMotion(expr.handRightRotate, life.handRightRotate)
  const handRightRotate = useAddMotion(handRightRotateBase, gesture.handRightRotate)
  const handRightYBase = useAddMotion(expr.handRightY, life.handRightY)
  const handRightY = useAddMotion(handRightYBase, gesture.handRightY)
  const rootY = useAddMotion(expr.rootY, life.rootFloatY)

  return {
    rootY,
    eyeScaleY,
    eyeX,
    eyeY,
    highlightY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    cheekFlush: life.cheekFlush,
    headRotate,
    headY,
    figureY,
    bodyShiftX: life.bodyShiftX,
    bodyScale,
    shoulderLeftRotate: life.shoulderLeftRotate,
    shoulderRightRotate: life.shoulderRightRotate,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    hairY: life.hairY,
    hairRotate: life.hairRotate,
    shadowScale: life.shadowScale,
    shadowOpacity: life.shadowOpacity,
    ambientOpacity: life.ambientGlowOpacity,
    ambientScale: life.ambientGlowScale,
    glowOpacity: expr.glowOpacity,
    glowScale: expr.glowScale,
  }
}
