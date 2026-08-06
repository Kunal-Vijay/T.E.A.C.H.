import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import {
  GESTURE_IN_SPRING,
  GESTURE_OUT_SPRING,
  GESTURE_PEAKS,
  GESTURE_RUNNERS,
  NEUTRAL_GESTURE_OFFSET,
  type AvatarGestureName,
  type AvatarGestureOffset,
} from './avatarGestures'
import { usePageVisibility } from './usePageVisibility'

export interface AvatarGestureMotion {
  handLeftRotate: MotionValue<number>
  handLeftY: MotionValue<number>
  handRightRotate: MotionValue<number>
  handRightY: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  figureY: MotionValue<number>
  bodyScale: MotionValue<number>
}

function animateGestureOffset(
  motion: AvatarGestureMotion,
  offset: AvatarGestureOffset,
  transition: Record<string, unknown>,
): Promise<unknown> {
  return Promise.all([
    animate(motion.handLeftRotate, offset.handLeftRotate, transition),
    animate(motion.handLeftY, offset.handLeftY, transition),
    animate(motion.handRightRotate, offset.handRightRotate, transition),
    animate(motion.handRightY, offset.handRightY, transition),
    animate(motion.headRotate, offset.headRotate, transition),
    animate(motion.headY, offset.headY, transition),
    animate(motion.figureY, offset.figureY, transition),
    animate(motion.bodyScale, offset.bodyScale, transition),
  ])
}

/**
 * Interruptible gesture layer for InteractiveAvatar.
 * Offsets stack additively (hands/head) or multiplicatively (body) on other layers.
 */
export function useAvatarGestureEngine(): {
  motion: AvatarGestureMotion
  playGesture: (name: AvatarGestureName) => void
  activeGesture: AvatarGestureName | null
} {
  const pageVisible = usePageVisibility()
  const reduceMotion = useReducedMotion()

  const handLeftRotate = useMotionValue(0)
  const handLeftY = useMotionValue(0)
  const handRightRotate = useMotionValue(0)
  const handRightY = useMotionValue(0)
  const headRotate = useMotionValue(0)
  const headY = useMotionValue(0)
  const figureY = useMotionValue(0)
  const bodyScale = useMotionValue(1)

  const motionRef = useRef<AvatarGestureMotion>({
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    headRotate,
    headY,
    figureY,
    bodyScale,
  })

  motionRef.current = {
    handLeftRotate,
    handLeftY,
    handRightRotate,
    handRightY,
    headRotate,
    headY,
    figureY,
    bodyScale,
  }

  const sessionRef = useRef<{ cancelled: boolean } | null>(null)
  const [activeGesture, setActiveGesture] = useState<AvatarGestureName | null>(null)

  const playGesture = useCallback((name: AvatarGestureName) => {
    if (reduceMotion === true || !pageVisible) {
      return
    }

    if (sessionRef.current) {
      sessionRef.current.cancelled = true
    }

    const signal = { cancelled: false }
    sessionRef.current = signal
    setActiveGesture(name)

    const motion = motionRef.current
    const peak = GESTURE_PEAKS[name]
    const runner = GESTURE_RUNNERS[name]

    const animateTo = (offset: AvatarGestureOffset, transition: Record<string, unknown>) =>
      animateGestureOffset(motion, offset, transition)

    const run = async () => {
      try {
        await animateTo(peak, GESTURE_IN_SPRING)
        if (signal.cancelled) {
          return
        }

        await runner({
          motion: {
            handLeftRotate: motion.handLeftRotate,
            handLeftY: motion.handLeftY,
            handRightRotate: motion.handRightRotate,
            handRightY: motion.handRightY,
            headRotate: motion.headRotate,
            headY: motion.headY,
            figureY: motion.figureY,
            bodyScale: motion.bodyScale,
          },
          peak,
          signal,
          springIn: () => GESTURE_IN_SPRING,
          springOut: () => GESTURE_OUT_SPRING,
          animateTo,
        })

        if (signal.cancelled) {
          return
        }

        await animateTo(NEUTRAL_GESTURE_OFFSET, GESTURE_OUT_SPRING)
      } finally {
        if (sessionRef.current === signal) {
          sessionRef.current = null
          setActiveGesture(null)
        }
      }
    }

    void run()
  }, [pageVisible, reduceMotion])

  return {
    motion: motionRef.current,
    playGesture,
    activeGesture,
  }
}

/** Static neutral layer when gesture provider is absent. */
export function useNeutralGestureMotion(): AvatarGestureMotion {
  return {
    handLeftRotate: useMotionValue(0),
    handLeftY: useMotionValue(0),
    handRightRotate: useMotionValue(0),
    handRightY: useMotionValue(0),
    headRotate: useMotionValue(0),
    headY: useMotionValue(0),
    figureY: useMotionValue(0),
    bodyScale: useMotionValue(1),
  }
}
