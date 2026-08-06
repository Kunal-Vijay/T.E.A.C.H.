import type { TutorId } from '../../types/mentor.types'
import { femaleTeacherConfig } from './characters/femaleTeacher'
import { maleTeacherConfig } from './characters/maleTeacher'
import type { AvatarCharacterId, AvatarConfig } from './AvatarTheme'
import { CURRENT_TUTOR_ID } from '../../lib/tutor/tutor.config'

export type {
  AvatarCharacterId,
  AvatarAssets,
  AvatarClothingConfig,
  AvatarClothingVariant,
  AvatarConfig,
  AvatarExpressionScales,
  AvatarGestureScales,
  AvatarHairConfig,
  AvatarHairVariant,
  AvatarTheme,
  AvatarVoiceProfileRef,
} from './AvatarTheme'

export {
  AVATAR_CHARACTER_IDS,
  avatarThemeToStyle,
  getExpressionScale,
  getGestureScale,
} from './AvatarTheme'

export { DEFAULT_AVATAR_SILHOUETTE, createAvatarAssets } from './AvatarAssets'

export const AVATAR_CONFIGS: Record<AvatarCharacterId, AvatarConfig> = {
  'female-teacher': femaleTeacherConfig,
  'male-teacher': maleTeacherConfig,
}

export const DEFAULT_AVATAR_CHARACTER_ID: AvatarCharacterId = 'female-teacher'

export function getAvatarConfig(id: AvatarCharacterId): AvatarConfig {
  return AVATAR_CONFIGS[id]
}

export function isAvatarCharacterId(value: string): value is AvatarCharacterId {
  return value in AVATAR_CONFIGS
}

/** Map tutor personas to interactive teacher characters when no explicit override. */
const TUTOR_TO_CHARACTER: Partial<Record<TutorId, AvatarCharacterId>> = {
  nova: 'female-teacher',
}

export function resolveAvatarCharacterId(
  tutorId?: TutorId,
  fallback: AvatarCharacterId = DEFAULT_AVATAR_CHARACTER_ID,
): AvatarCharacterId {
  const id = tutorId ?? CURRENT_TUTOR_ID
  return TUTOR_TO_CHARACTER[id] ?? fallback
}

export function listAvatarConfigs(): AvatarConfig[] {
  return Object.values(AVATAR_CONFIGS)
}
