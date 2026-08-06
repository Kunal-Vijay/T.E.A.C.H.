import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  createCompanionActionBag,
  runCompanionAction,
  type CompanionActionId,
} from './avatarCompanionScheduler'
import { AVATAR_EASE_SMOOTH } from './avatarEasing'
import { randomBetween, sleep } from './avatarIdleRandom'
import { usePageVisibility } from './usePageVisibility'

export interface AvatarIdleLifeMotion {
  blink: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  hairY: MotionValue<number>
  hairRotate: MotionValue<number>
  bodyScale: MotionValue<number>
  handLeftRotate: MotionValue<number>
  handLeftY: MotionValue<number>
  handRightRotate: MotionValue<number>
  handRightY: MotionValue<number>
  browLeftY: MotionValue<number>
  browRightY: MotionValue<number>
  browLeftRotate: MotionValue<number>
  browRightRotate: MotionValue<number>
  mouthScaleX: MotionValue<number>
  mouthScaleY: MotionValue<number>
  mouthCurve: MotionValue<number>
  figureY: MotionValue<number>
  /** Gentle vertical float for desktop companion feel. */
  rootFloatY: MotionValue<number>
  /** Soft ground shadow pulse synced with breathing. */
  shadowScale: MotionValue<number>
  shadowOpacity: MotionValue<number>
  /** Subtle lateral idle sway. */
  bodyShiftX: MotionValue<number>
  /** Gentle shoulder roll synced with breathing. */
  shoulderLeftRotate: MotionValue<number>
  shoulderRightRotate: MotionValue<number>
  /** Soft ambient halo pulse. */
  ambientGlowOpacity: MotionValue<number>
  ambientGlowScale: MotionValue<number>
  /** Micro cheek warmth during smiles / idle warmth. */
  cheekFlush: MotionValue<number>
}

function scheduleLoop(
  active: boolean,
  runner: (signal: { cancelled: boolean }) => Promise<void>,
): () => void {
  if (!active) {
    return () => {}
  }

  const signal = { cancelled: false }

  const tick = async () => {
    while (!signal.cancelled) {
      await runner(signal)
    }
  }

  void tick()

  return () => {
    signal.cancelled = true
  }
}

export interface AvatarIdleLifeOptions {
  /** Calm desktop companion — float, breath, non-repeating action bag. */
  companion?: boolean
  /** Animate resting mouth variation (disabled while talking). */
  animateMouth?: boolean
  /** Richer idle shifts — head nod, smile, hand sway. */
  microMovements?: boolean
}

/**
 * Randomized companion idle life for InteractiveAvatar.
 * Uses a shuffled action bag so sequences never repeat identically.
 * Pauses when the tab is hidden or reduced motion is preferred.
 */
export function useAvatarIdleLife(
  enabled: boolean,
  options: AvatarIdleLifeOptions = {},
): AvatarIdleLifeMotion {
  const {
    companion = false,
    animateMouth = true,
    microMovements = true,
  } = options
  const pageVisible = usePageVisibility()
  const reduceMotion = useReducedMotion()
  const active = enabled && pageVisible && reduceMotion !== true
  const companionActive = active && companion
  const schedulerActive = companionActive
  const floatActive = companionActive
  const breathActive = companionActive
  const allowSmile = animateMouth && microMovements

  const blink = useMotionValue(1)
  const eyeX = useMotionValue(0)
  const eyeY = useMotionValue(0)
  const headRotate = useMotionValue(0)
  const headY = useMotionValue(0)
  const hairY = useMotionValue(0)
  const hairRotate = useMotionValue(0)
  const bodyScale = useMotionValue(1)
  const handLeftRotate = useMotionValue(0)
  const handLeftY = useMotionValue(0)
  const handRightRotate = useMotionValue(0)
  const handRightY = useMotionValue(0)
  const browLeftY = useMotionValue(0)
  const browRightY = useMotionValue(0)
  const browLeftRotate = useMotionValue(0)
  const browRightRotate = useMotionValue(0)
  const mouthScaleX = useMotionValue(1)
  const mouthScaleY = useMotionValue(1)
  const mouthCurve = useMotionValue(0)
  const figureY = useMotionValue(0)
  const rootFloatY = useMotionValue(0)
  const shadowScale = useMotionValue(1)
  const shadowOpacity = useMotionValue(0.32)
  const bodyShiftX = useMotionValue(0)
  const shoulderLeftRotate = useMotionValue(0)
  const shoulderRightRotate = useMotionValue(0)
  const ambientGlowOpacity = useMotionValue(0.42)
  const ambientGlowScale = useMotionValue(1)
  const cheekFlush = useMotionValue(0)

  const motionTargets = {
    blink,
    eyeX,
    eyeY,
    headRotate,
    headY,
    hairY,
    hairRotate,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    figureY,
    bodyShiftX,
    shoulderLeftRotate,
    shoulderRightRotate,
    cheekFlush,
  }

  useEffect(() => {
    if (companionActive || microMovements) {
      return
    }

    headRotate.set(0)
    headY.set(0)
    hairY.set(0)
    hairRotate.set(0)
    bodyScale.set(1)
    figureY.set(0)
    handLeftRotate.set(0)
    handLeftY.set(0)
    handRightRotate.set(0)
    handRightY.set(0)
    browLeftY.set(0)
    browRightY.set(0)
    browLeftRotate.set(0)
    browRightRotate.set(0)
    mouthScaleX.set(1)
    mouthScaleY.set(1)
    mouthCurve.set(0)
    eyeX.set(0)
    eyeY.set(0)
    bodyShiftX.set(0)
    rootFloatY.set(0)
    shadowScale.set(1)
    shadowOpacity.set(0.32)
    shoulderLeftRotate.set(0)
    shoulderRightRotate.set(0)
    ambientGlowOpacity.set(0.42)
    ambientGlowScale.set(1)
    cheekFlush.set(0)
  }, [
    companionActive,
    microMovements,
    headRotate,
    headY,
    hairY,
    hairRotate,
    bodyScale,
    figureY,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    eyeX,
    eyeY,
    bodyShiftX,
    rootFloatY,
    shadowScale,
    shadowOpacity,
    shoulderLeftRotate,
    shoulderRightRotate,
    ambientGlowOpacity,
    ambientGlowScale,
    cheekFlush,
  ])

  const bagRef = useRef(createCompanionActionBag(microMovements))
  useEffect(() => {
    bagRef.current = createCompanionActionBag(microMovements)
  }, [microMovements])

  useEffect(() => {
    if (!schedulerActive) {
      return
    }

    return scheduleLoop(true, async (signal) => {
      const recent: CompanionActionId[] = []

      while (!signal.cancelled) {
        await sleep(randomBetween(2400, 6200), signal)
        if (signal.cancelled) {
          return
        }

        let action = bagRef.current.pick(recent)
        if (!allowSmile && action === 'softSmile') {
          action = bagRef.current.pick([...recent, 'softSmile'])
        }

        recent.push(action)
        if (recent.length > 2) {
          recent.shift()
        }

        await runCompanionAction(action, motionTargets)
      }
    })
  }, [schedulerActive, allowSmile])

  useEffect(() => {
    if (!floatActive) {
      return
    }

    return scheduleLoop(true, async (signal) => {
      while (!signal.cancelled) {
        const drift = randomBetween(-1.4, 1.4)
        const duration = randomBetween(7, 12)

        await animate(rootFloatY, drift, { duration, ease: AVATAR_EASE_SMOOTH })
        if (signal.cancelled) {
          return
        }

        await animate(rootFloatY, randomBetween(-0.6, 0.6), {
          duration: randomBetween(6, 10),
          ease: AVATAR_EASE_SMOOTH,
        })
      }
    })
  }, [floatActive, rootFloatY])

  useEffect(() => {
    if (!breathActive) {
      return
    }

    return scheduleLoop(true, async (signal) => {
      while (!signal.cancelled) {
        const inhale = randomBetween(2.8, 4.2)
        const exhale = randomBetween(3, 4.6)

        const shoulderLift = randomBetween(0.6, 1.2)

        await Promise.all([
          animate(bodyScale, randomBetween(1.008, 1.018), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shadowScale, randomBetween(1.02, 1.06), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shadowOpacity, randomBetween(0.34, 0.4), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(headY, randomBetween(-0.6, -0.2), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shoulderLeftRotate, -shoulderLift, { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shoulderRightRotate, shoulderLift, { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(ambientGlowOpacity, randomBetween(0.48, 0.58), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
          animate(ambientGlowScale, randomBetween(1.03, 1.07), { duration: inhale, ease: AVATAR_EASE_SMOOTH }),
        ])

        if (signal.cancelled) {
          return
        }

        await Promise.all([
          animate(bodyScale, 1, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shadowScale, 1, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shadowOpacity, 0.32, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(headY, 0, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shoulderLeftRotate, 0, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(shoulderRightRotate, 0, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(ambientGlowOpacity, 0.42, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
          animate(ambientGlowScale, 1, { duration: exhale, ease: AVATAR_EASE_SMOOTH }),
        ])
      }
    })
  }, [
    breathActive,
    bodyScale,
    shadowScale,
    shadowOpacity,
    headY,
    shoulderLeftRotate,
    shoulderRightRotate,
    ambientGlowOpacity,
    ambientGlowScale,
  ])

  return {
    blink,
    eyeX,
    eyeY,
    headRotate,
    headY,
    hairY,
    hairRotate,
    bodyScale,
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    figureY,
    rootFloatY,
    shadowScale,
    shadowOpacity,
    bodyShiftX,
    shoulderLeftRotate,
    shoulderRightRotate,
    ambientGlowOpacity,
    ambientGlowScale,
    cheekFlush,
  }
}
