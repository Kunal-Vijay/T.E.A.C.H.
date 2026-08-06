import { useTransform, type MotionValue } from 'framer-motion'

/** Multiply idle base with talk phoneme layer. */
export function useMultiplyMotion(
  base: MotionValue<number>,
  talk: MotionValue<number>,
): MotionValue<number> {
  return useTransform([base, talk], ([b, t]) => (b as number) * (t as number))
}

/** Multiply three motion layers (expression × idle × talk). */
export function useMultiplyTripleMotion(
  a: MotionValue<number>,
  b: MotionValue<number>,
  c: MotionValue<number>,
): MotionValue<number> {
  return useTransform([a, b, c], ([x, y, z]) => (x as number) * (y as number) * (z as number))
}

/** Add idle base with talk emphasis layer. */
export function useAddMotion(
  base: MotionValue<number>,
  talk: MotionValue<number>,
): MotionValue<number> {
  return useTransform([base, talk], ([b, t]) => (b as number) + (t as number))
}

/** Add talk curve on top of expression + idle mouth curve. */
export function useAddMouthCurve(
  base: MotionValue<number>,
  talk: MotionValue<number>,
): MotionValue<number> {
  return useTransform([base, talk], ([b, t]) => (b as number) + (t as number))
}

/** Add three motion layers (expression + idle + talk). */
export function useAddTripleMotion(
  a: MotionValue<number>,
  b: MotionValue<number>,
  c: MotionValue<number>,
): MotionValue<number> {
  return useTransform([a, b, c], ([x, y, z]) => (x as number) + (y as number) + (z as number))
}

/** Add four motion layers (expression + idle + talk + gesture). */
export function useAddQuadrupleMotion(
  a: MotionValue<number>,
  b: MotionValue<number>,
  c: MotionValue<number>,
  d: MotionValue<number>,
): MotionValue<number> {
  return useTransform(
    [a, b, c, d],
    ([w, x, y, z]) => (w as number) + (x as number) + (y as number) + (z as number),
  )
}

/** Multiply four motion layers (expression × idle × talk × gesture). */
export function useMultiplyQuadrupleMotion(
  a: MotionValue<number>,
  b: MotionValue<number>,
  c: MotionValue<number>,
  d: MotionValue<number>,
): MotionValue<number> {
  return useTransform(
    [a, b, c, d],
    ([w, x, y, z]) => (w as number) * (x as number) * (y as number) * (z as number),
  )
}
