/** Additive gesture offsets — layered on expression + idle + talk. */
export interface AvatarGestureOffset {
  handLeftRotate: number
  handLeftY: number
  handRightRotate: number
  handRightY: number
  headRotate: number
  headY: number
  figureY: number
  /** Multiplicative body scale — 1 = neutral. */
  bodyScale: number
}

export const NEUTRAL_GESTURE_OFFSET: AvatarGestureOffset = {
  handLeftRotate: 0,
  handLeftY: 0,
  handRightRotate: 0,
  handRightY: 0,
  headRotate: 0,
  headY: 0,
  figureY: 0,
  bodyScale: 1,
}

export type AvatarGestureName =
  | 'wave'
  | 'pointLeft'
  | 'pointRight'
  | 'explain'
  | 'openHands'
  | 'thumbsUp'
  | 'celebrate'
  | 'thinkingPose'
  | 'crossArms'

export const AVATAR_GESTURES: readonly AvatarGestureName[] = [
  'wave',
  'pointLeft',
  'pointRight',
  'explain',
  'openHands',
  'thumbsUp',
  'celebrate',
  'thinkingPose',
  'crossArms',
]

/** Subtle peak poses — friendly teacher, not cartoon. */
export const GESTURE_PEAKS: Record<AvatarGestureName, AvatarGestureOffset> = {
  wave: {
    handLeftRotate: 4,
    handLeftY: 0,
    handRightRotate: -30,
    handRightY: -9,
    headRotate: 2.5,
    headY: -0.5,
    figureY: 0,
    bodyScale: 1,
  },
  pointLeft: {
    handLeftRotate: 24,
    handLeftY: -5,
    handRightRotate: -4,
    handRightY: 0,
    headRotate: -3.5,
    headY: 0,
    figureY: 0,
    bodyScale: 1,
  },
  pointRight: {
    handLeftRotate: 4,
    handLeftY: 0,
    handRightRotate: -24,
    handRightY: -5,
    headRotate: 3.5,
    headY: 0,
    figureY: 0,
    bodyScale: 1,
  },
  explain: {
    handLeftRotate: 14,
    handLeftY: -4,
    handRightRotate: -16,
    handRightY: -4,
    headRotate: 0,
    headY: -0.5,
    figureY: 0,
    bodyScale: 1,
  },
  openHands: {
    handLeftRotate: 16,
    handLeftY: -5,
    handRightRotate: -16,
    handRightY: -5,
    headRotate: 1,
    headY: -0.5,
    figureY: 0,
    bodyScale: 1.01,
  },
  thumbsUp: {
    handLeftRotate: 6,
    handLeftY: 0,
    handRightRotate: -36,
    handRightY: -8,
    headRotate: 2,
    headY: -0.5,
    figureY: 0,
    bodyScale: 1,
  },
  celebrate: {
    handLeftRotate: 22,
    handLeftY: -7,
    handRightRotate: -22,
    handRightY: -7,
    headRotate: 0,
    headY: -1,
    figureY: -2,
    bodyScale: 1.015,
  },
  thinkingPose: {
    handLeftRotate: 10,
    handLeftY: -1,
    handRightRotate: -8,
    handRightY: -6,
    headRotate: 4,
    headY: -0.5,
    figureY: 0,
    bodyScale: 1,
  },
  crossArms: {
    handLeftRotate: 18,
    handLeftY: 2,
    handRightRotate: -18,
    handRightY: 2,
    headRotate: -1,
    headY: 0,
    figureY: 0,
    bodyScale: 0.995,
  },
}

export interface GestureMotionTarget {
  handLeftRotate: { set: (v: number) => void; get: () => number }
  handLeftY: { set: (v: number) => void; get: () => number }
  handRightRotate: { set: (v: number) => void; get: () => number }
  handRightY: { set: (v: number) => void; get: () => number }
  headRotate: { set: (v: number) => void; get: () => number }
  headY: { set: (v: number) => void; get: () => number }
  figureY: { set: (v: number) => void; get: () => number }
  bodyScale: { set: (v: number) => void; get: () => number }
}

export interface GestureRunContext {
  motion: GestureMotionTarget
  peak: AvatarGestureOffset
  signal: { cancelled: boolean }
  springIn: () => Record<string, unknown>
  springOut: () => Record<string, unknown>
  animateTo: (offset: AvatarGestureOffset, transition: Record<string, unknown>) => Promise<unknown>
}

export type GestureRunner = (ctx: GestureRunContext) => Promise<void>

const GESTURE_IN_SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 26,
  mass: 0.88,
}

const GESTURE_OUT_SPRING = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 24,
  mass: 0.9,
}

const GESTURE_WAVE_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 22,
  mass: 0.75,
}

async function waveRunner(ctx: GestureRunContext): Promise<void> {
  for (let i = 0; i < 2; i += 1) {
    if (ctx.signal.cancelled) {
      return
    }
    await ctx.animateTo(
      {
        ...ctx.peak,
        handRightRotate: ctx.peak.handRightRotate - 5,
      },
      GESTURE_WAVE_SPRING,
    )
    if (ctx.signal.cancelled) {
      return
    }
    await ctx.animateTo(
      {
        ...ctx.peak,
        handRightRotate: ctx.peak.handRightRotate + 5,
      },
      GESTURE_WAVE_SPRING,
    )
  }
  if (!ctx.signal.cancelled) {
    await ctx.animateTo(ctx.peak, GESTURE_WAVE_SPRING)
  }
}

async function explainRunner(ctx: GestureRunContext): Promise<void> {
  const base = ctx.peak
  for (let i = 0; i < 2; i += 1) {
    if (ctx.signal.cancelled) {
      return
    }
    await ctx.animateTo(
      {
        ...base,
        handLeftY: base.handLeftY - 2,
        handRightY: base.handRightY + 1,
        headRotate: 1.2,
      },
      GESTURE_IN_SPRING,
    )
    if (ctx.signal.cancelled) {
      return
    }
    await ctx.animateTo(
      {
        ...base,
        handLeftY: base.handLeftY + 1,
        handRightY: base.handRightY - 2,
        headRotate: -1,
      },
      GESTURE_IN_SPRING,
    )
  }
  if (!ctx.signal.cancelled) {
    await ctx.animateTo(base, GESTURE_IN_SPRING)
  }
}

async function celebrateRunner(ctx: GestureRunContext): Promise<void> {
  if (ctx.signal.cancelled) {
    return
  }
  await ctx.animateTo(
    { ...ctx.peak, figureY: ctx.peak.figureY - 1.5, bodyScale: ctx.peak.bodyScale + 0.008 },
    GESTURE_IN_SPRING,
  )
  if (ctx.signal.cancelled) {
    return
  }
  await ctx.animateTo(ctx.peak, GESTURE_IN_SPRING)
}

async function holdRunner(ctx: GestureRunContext, ms = 520): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (ctx.signal.cancelled) {
      return
    }
    await new Promise((resolve) => {
      window.setTimeout(resolve, 40)
    })
  }
}

export const GESTURE_RUNNERS: Record<AvatarGestureName, GestureRunner> = {
  wave: waveRunner,
  pointLeft: (ctx) => holdRunner(ctx),
  pointRight: (ctx) => holdRunner(ctx),
  explain: explainRunner,
  openHands: (ctx) => holdRunner(ctx, 580),
  thumbsUp: (ctx) => holdRunner(ctx, 640),
  celebrate: celebrateRunner,
  thinkingPose: (ctx) => holdRunner(ctx, 720),
  crossArms: (ctx) => holdRunner(ctx, 680),
}

export { GESTURE_IN_SPRING, GESTURE_OUT_SPRING }
