import type { AvatarAssets } from './AvatarTheme'
import tutorSilhouette from './assets/tutor-silhouette.svg'

/** Shared default silhouette — characters differentiate via theme + CSS. */
export const DEFAULT_AVATAR_SILHOUETTE = tutorSilhouette

export function createAvatarAssets(silhouette: string = DEFAULT_AVATAR_SILHOUETTE): AvatarAssets {
  return { silhouette }
}

export type { AvatarAssets }
