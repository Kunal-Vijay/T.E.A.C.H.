import type { CSSProperties } from 'react'
import type { AvatarExpression } from './AvatarExpression'
import type { AvatarGestureName } from './avatarGestures'

/** Extensible interactive teacher character ids. */
export type AvatarCharacterId =
  | 'female-teacher'
  | 'male-teacher'

export const AVATAR_CHARACTER_IDS: readonly AvatarCharacterId[] = [
  'female-teacher',
  'male-teacher',
]

/** Color palette applied via CSS custom properties on InteractiveAvatar. */
export interface AvatarTheme {
  accent: string
  accentSoft: string
  secondary: string
  glow: string
  skin: string
  hair: string
  hairHighlight: string
  clothing: string
  clothingAccent: string
  eye: string
  lip: string
}

/** Static assets for a character — swap paths only, never components. */
export interface AvatarAssets {
  silhouette: string
}

export type AvatarHairVariant = 'soft-long' | 'neat-short'
export type AvatarClothingVariant = 'cardigan' | 'polo'

export interface AvatarHairConfig {
  variant: AvatarHairVariant
  tuftCount: 3 | 4 | 5
  showBangs: boolean
}

export interface AvatarClothingConfig {
  variant: AvatarClothingVariant
  showCollar: boolean
}

/** Reserved for future voice binding — not wired to TTS yet. */
export interface AvatarVoiceProfileRef {
  voiceId?: string
  pitch?: number
  tempo?: number
}

/** Per-character expression emphasis (1 = default). */
export type AvatarExpressionScales = Partial<Record<AvatarExpression, number>>

/** Per-character gesture emphasis (1 = default). */
export interface AvatarGestureScales extends Partial<Record<AvatarGestureName, number>> {
  default?: number
}

export interface AvatarConfig {
  id: AvatarCharacterId
  name: string
  theme: AvatarTheme
  assets: AvatarAssets
  hair: AvatarHairConfig
  clothing: AvatarClothingConfig
  expressions: AvatarExpressionScales
  gestures: AvatarGestureScales
  voice?: AvatarVoiceProfileRef
}

export function avatarThemeToStyle(theme: AvatarTheme): CSSProperties {
  return {
    '--mentor-accent': theme.accent,
    '--mentor-accent-soft': theme.accentSoft,
    '--mentor-secondary': theme.secondary,
    '--mentor-glow': theme.glow,
    '--mentor-skin': theme.skin,
    '--avatar-hair': theme.hair,
    '--avatar-hair-highlight': theme.hairHighlight,
    '--avatar-clothing': theme.clothing,
    '--avatar-clothing-accent': theme.clothingAccent,
    '--avatar-eye': theme.eye,
    '--avatar-lip': theme.lip,
  } as CSSProperties
}

export function getExpressionScale(
  config: AvatarConfig,
  expression: AvatarExpression,
): number {
  return config.expressions[expression] ?? 1
}

export function getGestureScale(
  config: AvatarConfig,
  gesture: AvatarGestureName,
): number {
  return config.gestures[gesture] ?? config.gestures.default ?? 1
}
