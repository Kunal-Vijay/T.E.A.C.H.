/** Production easing curves — GPU-friendly cubic-bezier, 60fps target. */
export const AVATAR_EASE_SMOOTH = [0.33, 1, 0.38, 1] as const
export const AVATAR_EASE_IN = [0.4, 0, 0.72, 0] as const
export const AVATAR_EASE_OUT = [0.22, 1, 0.36, 1] as const
export const AVATAR_EASE_SPRING = [0.34, 1.15, 0.44, 1] as const

export type AvatarEase = typeof AVATAR_EASE_SMOOTH

export function avatarTransition(duration: number, ease: AvatarEase = AVATAR_EASE_SMOOTH) {
  return { duration, ease: [...ease] as [number, number, number, number] }
}
