import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  NEUTRAL_MOUTH,
  NEUTRAL_TALK_POSE,
  PHONEME_SEQUENCE,
  PHONEME_SHAPES,
  type PhonemeId,
} from './avatarPhonemes'
import { randomBetween, randomChance, randomPick, sleep } from './avatarIdleRandom'
import { usePageVisibility } from './usePageVisibility'

const GPU_EASE = [0.22, 1, 0.36, 1] as const
const RETURN_MS = 0.42

export interface AvatarTalkMotion {
  mouthScaleX: MotionValue<number>
  mouthScaleY: MotionValue<number>
  mouthCurve: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  browLeftY: MotionValue<number>
  browRightY: MotionValue<number>
  browLeftRotate: MotionValue<number>
  browRightRotate: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  bodyScale: MotionValue<number>
}

function pickPhoneme(last: PhonemeId | null): PhonemeId {
  const pool = last === null
    ? PHONEME_SEQUENCE
    : PHONEME_SEQUENCE.filter((id) => id !== last || randomChance(0.25))
  return randomPick(pool)
}

async function returnTalkToNeutral(motion: AvatarTalkMotion): Promise<void> {
  await Promise.all([
    animate(motion.mouthScaleX, NEUTRAL_MOUTH.scaleX, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.mouthScaleY, NEUTRAL_MOUTH.scaleY, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.mouthCurve, NEUTRAL_MOUTH.curve, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.headRotate, NEUTRAL_TALK_POSE.headRotate, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.headY, NEUTRAL_TALK_POSE.headY, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.browLeftY, NEUTRAL_TALK_POSE.browLeftY, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.browRightY, NEUTRAL_TALK_POSE.browRightY, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.browLeftRotate, NEUTRAL_TALK_POSE.browLeftRotate, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.browRightRotate, NEUTRAL_TALK_POSE.browRightRotate, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.eyeX, NEUTRAL_TALK_POSE.eyeX, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.eyeY, NEUTRAL_TALK_POSE.eyeY, { duration: RETURN_MS, ease: GPU_EASE }),
    animate(motion.bodyScale, NEUTRAL_TALK_POSE.bodyScale, { duration: RETURN_MS, ease: GPU_EASE }),
  ])
}

/**
 * Realistic phoneme-driven speech layer for InteractiveAvatar.
 * Blends additively with idle motion via useTransform in the view layer.
 */
export function useAvatarTalking(isTalking: boolean): AvatarTalkMotion {
  const pageVisible = usePageVisibility()
  const reduceMotion = useReducedMotion()
  const active = isTalking && pageVisible && reduceMotion !== true

  const mouthScaleX = useMotionValue<number>(NEUTRAL_MOUTH.scaleX)
  const mouthScaleY = useMotionValue<number>(NEUTRAL_MOUTH.scaleY)
  const mouthCurve = useMotionValue<number>(NEUTRAL_MOUTH.curve)
  const headRotate = useMotionValue<number>(NEUTRAL_TALK_POSE.headRotate)
  const headY = useMotionValue<number>(NEUTRAL_TALK_POSE.headY)
  const browLeftY = useMotionValue<number>(NEUTRAL_TALK_POSE.browLeftY)
  const browRightY = useMotionValue<number>(NEUTRAL_TALK_POSE.browRightY)
  const browLeftRotate = useMotionValue<number>(NEUTRAL_TALK_POSE.browLeftRotate)
  const browRightRotate = useMotionValue<number>(NEUTRAL_TALK_POSE.browRightRotate)
  const eyeX = useMotionValue<number>(NEUTRAL_TALK_POSE.eyeX)
  const eyeY = useMotionValue<number>(NEUTRAL_TALK_POSE.eyeY)
  const bodyScale = useMotionValue<number>(NEUTRAL_TALK_POSE.bodyScale)

  const motionRef = useRef<AvatarTalkMotion>({
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    headRotate,
    headY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    eyeX,
    eyeY,
    bodyScale,
  })

  motionRef.current = {
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    headRotate,
    headY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    eyeX,
    eyeY,
    bodyScale,
  }

  useEffect(() => {
    if (!active) {
      void returnTalkToNeutral(motionRef.current)
      return
    }

    const signal = { cancelled: false }
    let lastPhoneme: PhonemeId | null = null

    const run = async () => {
      while (!signal.cancelled) {
        const phoneme = pickPhoneme(lastPhoneme)
        lastPhoneme = phoneme
        const shape = PHONEME_SHAPES[phoneme]

        const tempo = randomBetween(0.82, 1.22)
        const attack = randomBetween(0.05, 0.12) * tempo
        const hold = randomBetween(0.04, 0.14) * tempo
        const release = randomBetween(0.06, 0.16) * tempo

        const headNudge = randomBetween(-1.8, 1.8)
        const headLift = randomBetween(-0.8, 0.4)
        const focusX = randomBetween(-0.8, 1.2)
        const focusY = randomBetween(0.2, 1.4)
        const browEmphasis = phoneme === 'A' || phoneme === 'O'
          ? randomBetween(-1.2, -0.2)
          : randomBetween(-0.5, 0.2)
        const breath = randomBetween(1.008, 1.022)

        await Promise.all([
          animate(motionRef.current.mouthScaleX, shape.scaleX, { duration: attack, ease: GPU_EASE }),
          animate(motionRef.current.mouthScaleY, shape.scaleY, { duration: attack, ease: GPU_EASE }),
          animate(motionRef.current.mouthCurve, shape.curve, { duration: attack, ease: GPU_EASE }),
          animate(motionRef.current.headRotate, headNudge, { duration: attack * 1.4, ease: GPU_EASE }),
          animate(motionRef.current.headY, headLift, { duration: attack * 1.4, ease: GPU_EASE }),
          animate(motionRef.current.browLeftY, browEmphasis, { duration: attack * 1.2, ease: GPU_EASE }),
          animate(motionRef.current.browRightY, browEmphasis * randomBetween(0.85, 1.1), {
            duration: attack * 1.2,
            ease: GPU_EASE,
          }),
          animate(motionRef.current.browLeftRotate, randomBetween(-2, 2), {
            duration: attack * 1.2,
            ease: GPU_EASE,
          }),
          animate(motionRef.current.browRightRotate, randomBetween(-2, 2), {
            duration: attack * 1.2,
            ease: GPU_EASE,
          }),
          animate(motionRef.current.eyeX, focusX, { duration: attack * 1.6, ease: GPU_EASE }),
          animate(motionRef.current.eyeY, focusY, { duration: attack * 1.6, ease: GPU_EASE }),
          animate(motionRef.current.bodyScale, breath, { duration: attack * 2, ease: GPU_EASE }),
        ])

        await sleep(hold * 1000, signal)
        if (signal.cancelled) {
          return
        }

        const nextNeutral = randomChance(0.22) || phoneme === 'M'
        const releaseTarget = nextNeutral
          ? NEUTRAL_MOUTH
          : {
              scaleX: randomBetween(0.88, 1.02),
              scaleY: randomBetween(0.72, 0.95),
              curve: randomBetween(-1, 2),
            }

        await Promise.all([
          animate(motionRef.current.mouthScaleX, releaseTarget.scaleX, { duration: release, ease: GPU_EASE }),
          animate(motionRef.current.mouthScaleY, releaseTarget.scaleY, { duration: release, ease: GPU_EASE }),
          animate(motionRef.current.mouthCurve, releaseTarget.curve, { duration: release, ease: GPU_EASE }),
          animate(motionRef.current.headRotate, headNudge * 0.35, { duration: release * 1.3, ease: GPU_EASE }),
          animate(motionRef.current.headY, headLift * 0.4, { duration: release * 1.3, ease: GPU_EASE }),
          animate(motionRef.current.bodyScale, 1, { duration: release * 1.5, ease: GPU_EASE }),
        ])

        await sleep(randomBetween(20, 90), signal)
      }
    }

    void run()

    return () => {
      signal.cancelled = true
    }
  }, [
    active,
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    headRotate,
    headY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    eyeX,
    eyeY,
    bodyScale,
  ])

  return {
    mouthScaleX,
    mouthScaleY,
    mouthCurve,
    headRotate,
    headY,
    browLeftY,
    browRightY,
    browLeftRotate,
    browRightRotate,
    eyeX,
    eyeY,
    bodyScale,
  }
}
