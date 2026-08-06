import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  useAvatarGestureEngine,
  type AvatarGestureMotion,
} from './useAvatarGestureEngine'
import type { AvatarGestureName } from './avatarGestures'

interface AvatarGestureControlValue {
  playGesture: (name: AvatarGestureName) => void
  activeGesture: AvatarGestureName | null
}

const AvatarGestureMotionContext = createContext<AvatarGestureMotion | null>(null)
const AvatarGestureControlContext = createContext<AvatarGestureControlValue | null>(null)

export interface AvatarGestureProviderProps {
  children: ReactNode
}

/**
 * Provides gesture motion values to InteractiveAvatar and `playGesture` to callers.
 * Wrap avatars that should accept gestures; GIF avatars ignore this entirely.
 */
export function AvatarGestureProvider({ children }: AvatarGestureProviderProps) {
  const { motion, playGesture, activeGesture } = useAvatarGestureEngine()

  const control = useMemo<AvatarGestureControlValue>(() => ({
    playGesture,
    activeGesture,
  }), [playGesture, activeGesture])

  return (
    <AvatarGestureMotionContext.Provider value={motion}>
      <AvatarGestureControlContext.Provider value={control}>
        {children}
      </AvatarGestureControlContext.Provider>
    </AvatarGestureMotionContext.Provider>
  )
}

/** Trigger a gesture from classroom / tutor logic. */
export function useAvatarGesture(): AvatarGestureControlValue {
  const ctx = useContext(AvatarGestureControlContext)
  if (ctx === null) {
    throw new Error('useAvatarGesture must be used within AvatarGestureProvider')
  }
  return ctx
}

export function useAvatarGestureOptional(): AvatarGestureControlValue | null {
  return useContext(AvatarGestureControlContext)
}

/** Motion layer consumed by InteractiveAvatar — null outside provider. */
export function useAvatarGestureMotionOptional(): AvatarGestureMotion | null {
  return useContext(AvatarGestureMotionContext)
}
