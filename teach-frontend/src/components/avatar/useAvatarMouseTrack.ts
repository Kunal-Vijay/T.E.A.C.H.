import { animate, useMotionValue, type MotionValue } from 'framer-motion'
import { useEffect, type RefObject } from 'react'
import { usePageVisibility } from './usePageVisibility'

const GPU_EASE = [0.22, 1, 0.36, 1] as const
const MOUSE_THROTTLE_MS = 120
const MAX_LOOK_X = 2
const MAX_LOOK_Y = 1.3

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export interface AvatarMouseTrackMotion {
  lookX: MotionValue<number>
  lookY: MotionValue<number>
}

/**
 * Subtle eye tracking toward the cursor — throttled, passive, GPU-friendly.
 */
export function useAvatarMouseTrack(
  enabled: boolean,
  containerRef: RefObject<HTMLElement | null>,
): AvatarMouseTrackMotion {
  const pageVisible = usePageVisibility()
  const active = enabled && pageVisible
  const lookX = useMotionValue(0)
  const lookY = useMotionValue(0)

  useEffect(() => {
    if (!active) {
      lookX.set(0)
      lookY.set(0)
      return
    }

    let lastMove = 0

    const onMove = (event: MouseEvent) => {
      const now = Date.now()
      if (now - lastMove < MOUSE_THROTTLE_MS) {
        return
      }
      lastMove = now

      const el = containerRef.current
      if (el === null) {
        return
      }

      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      const centerX = rect.left + rect.width * 0.5
      const centerY = rect.top + rect.height * 0.36
      const normX = (event.clientX - centerX) / rect.width
      const normY = (event.clientY - centerY) / rect.height

      const targetX = clamp(normX * 4.2, -MAX_LOOK_X, MAX_LOOK_X)
      const targetY = clamp(normY * 3.2, -MAX_LOOK_Y, MAX_LOOK_Y)

      void animate(lookX, targetX, { duration: 0.42, ease: GPU_EASE })
      void animate(lookY, targetY, { duration: 0.42, ease: GPU_EASE })
    }

    const onLeave = () => {
      void animate(lookX, 0, { duration: 0.55, ease: GPU_EASE })
      void animate(lookY, 0, { duration: 0.55, ease: GPU_EASE })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [active, containerRef, lookX, lookY])

  return { lookX, lookY }
}
