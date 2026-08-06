import type { MotionValue } from 'framer-motion'
import { animate } from 'framer-motion'
import { AVATAR_EASE_IN, AVATAR_EASE_OUT, AVATAR_EASE_SMOOTH } from './avatarEasing'
import { randomBetween, randomChance, randomPick, shuffle } from './avatarIdleRandom'

const GPU_EASE = AVATAR_EASE_SMOOTH

export type CompanionActionId =
  | 'blink'
  | 'doubleBlink'
  | 'softSmile'
  | 'headNod'
  | 'idleShift'
  | 'browMicro'
  | 'eyeGlance'
  | 'mouthRelax'
  | 'handShift'
  | 'hairSway'

const ALL_COMPANION_ACTIONS: readonly CompanionActionId[] = [
  'blink',
  'doubleBlink',
  'softSmile',
  'headNod',
  'idleShift',
  'browMicro',
  'eyeGlance',
  'mouthRelax',
  'handShift',
  'hairSway',
]

const BASELINE_ACTIONS: readonly CompanionActionId[] = [
  'blink',
  'doubleBlink',
  'eyeGlance',
  'mouthRelax',
  'browMicro',
]

const FULL_MICRO_ACTIONS: readonly CompanionActionId[] = [
  'softSmile',
  'headNod',
  'idleShift',
  'handShift',
  'hairSway',
]

export interface CompanionMotionTargets {
  blink: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
  hairY: MotionValue<number>
  hairRotate: MotionValue<number>
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
  bodyShiftX: MotionValue<number>
  shoulderLeftRotate?: MotionValue<number>
  shoulderRightRotate?: MotionValue<number>
  cheekFlush?: MotionValue<number>
}

export interface CompanionActionBag {
  pick: (last: CompanionActionId[]) => CompanionActionId
}

export function createCompanionActionBag(fullMicro: boolean): CompanionActionBag {
  const pool = fullMicro
    ? [...ALL_COMPANION_ACTIONS]
    : [...BASELINE_ACTIONS]
  let bag = shuffle(pool)

  return {
    pick(last: CompanionActionId[]): CompanionActionId {
      if (bag.length === 0) {
        bag = shuffle(pool)
      }

      for (let i = bag.length - 1; i >= 0; i -= 1) {
        const candidate = bag[i]
        if (candidate !== undefined && !last.includes(candidate)) {
          bag.splice(i, 1)
          return candidate
        }
      }

      const fallback = bag.pop()
      if (fallback === undefined) {
        return randomPick(pool)
      }
      return fallback
    },
  }
}

async function blinkOnce(motion: CompanionMotionTargets, fast = false): Promise<void> {
  const closeMs = fast ? randomBetween(0.04, 0.065) : randomBetween(0.055, 0.1)
  const openMs = fast ? randomBetween(0.065, 0.1) : randomBetween(0.085, 0.14)
  const anticipateMs = fast ? randomBetween(0.04, 0.06) : randomBetween(0.06, 0.1)

  await Promise.all([
    animate(motion.browLeftY, randomBetween(-0.35, -0.15), { duration: anticipateMs, ease: AVATAR_EASE_OUT }),
    animate(motion.browRightY, randomBetween(-0.35, -0.15), { duration: anticipateMs, ease: AVATAR_EASE_OUT }),
    animate(motion.blink, 0.94, { duration: anticipateMs, ease: AVATAR_EASE_OUT }),
  ])

  await animate(motion.blink, randomBetween(0.06, 0.12), { duration: closeMs, ease: AVATAR_EASE_IN })

  await Promise.all([
    animate(motion.blink, 1, { duration: openMs, ease: AVATAR_EASE_SMOOTH }),
    animate(motion.browLeftY, 0, { duration: openMs * 1.1, ease: AVATAR_EASE_SMOOTH }),
    animate(motion.browRightY, 0, { duration: openMs * 1.1, ease: AVATAR_EASE_SMOOTH }),
  ])
}

export async function runCompanionAction(
  id: CompanionActionId,
  motion: CompanionMotionTargets,
): Promise<void> {
  switch (id) {
    case 'blink':
      await blinkOnce(motion)
      break

    case 'doubleBlink':
      await blinkOnce(motion)
      await new Promise((r) => { window.setTimeout(r, randomBetween(80, 140)) })
      await blinkOnce(motion, true)
      break

    case 'softSmile': {
      const cheek = motion.cheekFlush
      const smileAnims = [
        animate(motion.mouthScaleX, randomBetween(1.04, 1.08), { duration: 0.55, ease: GPU_EASE }),
        animate(motion.mouthScaleY, randomBetween(1.05, 1.1), { duration: 0.55, ease: GPU_EASE }),
        animate(motion.mouthCurve, randomBetween(-1.5, -0.5), { duration: 0.55, ease: GPU_EASE }),
        animate(motion.browLeftY, randomBetween(-0.6, -0.2), { duration: 0.55, ease: GPU_EASE }),
        animate(motion.browRightY, randomBetween(-0.6, -0.2), { duration: 0.55, ease: GPU_EASE }),
      ]
      if (cheek) {
        smileAnims.push(animate(cheek, randomBetween(0.18, 0.32), { duration: 0.55, ease: GPU_EASE }))
      }
      await Promise.all(smileAnims)
      await new Promise((r) => { window.setTimeout(r, randomBetween(900, 1600)) })
      const resetAnims = [
        animate(motion.mouthScaleX, 1, { duration: 0.65, ease: GPU_EASE }),
        animate(motion.mouthScaleY, 1, { duration: 0.65, ease: GPU_EASE }),
        animate(motion.mouthCurve, 0, { duration: 0.65, ease: GPU_EASE }),
        animate(motion.browLeftY, 0, { duration: 0.65, ease: GPU_EASE }),
        animate(motion.browRightY, 0, { duration: 0.65, ease: GPU_EASE }),
      ]
      if (cheek) {
        resetAnims.push(animate(cheek, 0, { duration: 0.65, ease: GPU_EASE }))
      }
      await Promise.all(resetAnims)
      break
    }

    case 'headNod':
      await animate(motion.headY, randomBetween(1, 1.8), { duration: 0.28, ease: GPU_EASE })
      await animate(motion.headY, randomBetween(-0.4, 0.2), { duration: 0.32, ease: GPU_EASE })
      await animate(motion.headY, 0, { duration: 0.38, ease: GPU_EASE })
      break

    case 'idleShift': {
      const shoulderAnims = []
      if (motion.shoulderLeftRotate && motion.shoulderRightRotate) {
        shoulderAnims.push(
          animate(motion.shoulderLeftRotate, randomBetween(-1.2, 1.2), { duration: 0.9, ease: GPU_EASE }),
          animate(motion.shoulderRightRotate, randomBetween(-1.2, 1.2), { duration: 0.9, ease: GPU_EASE }),
        )
      }
      await Promise.all([
        animate(motion.figureY, randomBetween(-1.2, -0.4), { duration: 0.9, ease: GPU_EASE }),
        animate(motion.headRotate, randomBetween(-1.2, 1.2), { duration: 0.9, ease: GPU_EASE }),
        animate(motion.bodyShiftX, randomBetween(-0.8, 0.8), { duration: 0.9, ease: GPU_EASE }),
        ...shoulderAnims,
      ])
      await new Promise((r) => { window.setTimeout(r, randomBetween(400, 900)) })
      const shoulderReset = []
      if (motion.shoulderLeftRotate && motion.shoulderRightRotate) {
        shoulderReset.push(
          animate(motion.shoulderLeftRotate, 0, { duration: 1.1, ease: GPU_EASE }),
          animate(motion.shoulderRightRotate, 0, { duration: 1.1, ease: GPU_EASE }),
        )
      }
      await Promise.all([
        animate(motion.figureY, 0, { duration: 1.1, ease: GPU_EASE }),
        animate(motion.headRotate, 0, { duration: 1.1, ease: GPU_EASE }),
        animate(motion.bodyShiftX, 0, { duration: 1.1, ease: GPU_EASE }),
        ...shoulderReset,
      ])
      break
    }

    case 'browMicro': {
      const cheek = motion.cheekFlush
      const browAnims = [
        animate(motion.browLeftY, randomBetween(-0.8, 0.2), { duration: 0.4, ease: GPU_EASE }),
        animate(motion.browRightY, randomBetween(-0.8, 0.2), { duration: 0.4, ease: GPU_EASE }),
        animate(motion.browLeftRotate, randomBetween(-2, 2), { duration: 0.4, ease: GPU_EASE }),
        animate(motion.browRightRotate, randomBetween(-2, 2), { duration: 0.4, ease: GPU_EASE }),
      ]
      if (cheek && randomChance(0.45)) {
        browAnims.push(animate(cheek, randomBetween(0.08, 0.16), { duration: 0.4, ease: GPU_EASE }))
      }
      await Promise.all(browAnims)
      await new Promise((r) => { window.setTimeout(r, randomBetween(350, 700)) })
      const reset = [
        animate(motion.browLeftY, 0, { duration: 0.5, ease: GPU_EASE }),
        animate(motion.browRightY, 0, { duration: 0.5, ease: GPU_EASE }),
        animate(motion.browLeftRotate, 0, { duration: 0.5, ease: GPU_EASE }),
        animate(motion.browRightRotate, 0, { duration: 0.5, ease: GPU_EASE }),
      ]
      if (cheek) {
        reset.push(animate(cheek, 0, { duration: 0.5, ease: GPU_EASE }))
      }
      await Promise.all(reset)
      break
    }

    case 'eyeGlance':
      await Promise.all([
        animate(motion.eyeX, randomBetween(-2, 2), { duration: 0.45, ease: GPU_EASE }),
        animate(motion.eyeY, randomBetween(-1, 1.2), { duration: 0.45, ease: GPU_EASE }),
      ])
      await new Promise((r) => { window.setTimeout(r, randomBetween(500, 1200)) })
      await Promise.all([
        animate(motion.eyeX, 0, { duration: 0.55, ease: GPU_EASE }),
        animate(motion.eyeY, 0, { duration: 0.55, ease: GPU_EASE }),
      ])
      break

    case 'mouthRelax':
      await Promise.all([
        animate(motion.mouthScaleX, randomBetween(0.96, 1.02), { duration: 0.7, ease: GPU_EASE }),
        animate(motion.mouthScaleY, randomBetween(0.96, 1.02), { duration: 0.7, ease: GPU_EASE }),
        animate(motion.mouthCurve, randomBetween(-0.5, 1.5), { duration: 0.7, ease: GPU_EASE }),
      ])
      await new Promise((r) => { window.setTimeout(r, randomBetween(600, 1100)) })
      await Promise.all([
        animate(motion.mouthScaleX, 1, { duration: 0.75, ease: GPU_EASE }),
        animate(motion.mouthScaleY, 1, { duration: 0.75, ease: GPU_EASE }),
        animate(motion.mouthCurve, 0, { duration: 0.75, ease: GPU_EASE }),
      ])
      break

    case 'handShift':
      await Promise.all([
        animate(motion.handLeftRotate, randomBetween(-4, 4), { duration: 0.85, ease: GPU_EASE }),
        animate(motion.handRightRotate, randomBetween(-4, 4), { duration: 0.85, ease: GPU_EASE }),
        animate(motion.handLeftY, randomBetween(-1, 1), { duration: 0.85, ease: GPU_EASE }),
        animate(motion.handRightY, randomBetween(-1, 1), { duration: 0.85, ease: GPU_EASE }),
      ])
      await new Promise((r) => { window.setTimeout(r, randomBetween(500, 1000)) })
      await Promise.all([
        animate(motion.handLeftRotate, 0, { duration: 0.95, ease: GPU_EASE }),
        animate(motion.handRightRotate, 0, { duration: 0.95, ease: GPU_EASE }),
        animate(motion.handLeftY, 0, { duration: 0.95, ease: GPU_EASE }),
        animate(motion.handRightY, 0, { duration: 0.95, ease: GPU_EASE }),
      ])
      break

    case 'hairSway':
      await Promise.all([
        animate(motion.hairY, randomBetween(-1.5, -0.3), { duration: 1.1, ease: GPU_EASE }),
        animate(motion.hairRotate, randomBetween(-1, 1), { duration: 1.1, ease: GPU_EASE }),
      ])
      await new Promise((r) => { window.setTimeout(r, randomBetween(400, 800)) })
      await Promise.all([
        animate(motion.hairY, 0, { duration: 1.2, ease: GPU_EASE }),
        animate(motion.hairRotate, 0, { duration: 1.2, ease: GPU_EASE }),
      ])
      break

    default:
      if (randomChance(0.5)) {
        await blinkOnce(motion)
      }
      break
  }
}

export { BASELINE_ACTIONS, FULL_MICRO_ACTIONS, ALL_COMPANION_ACTIONS }
