export { default as Avatar } from './Avatar'
export type { AvatarProps } from './Avatar'
export {
  AvatarProvider,
  AvatarConfigScope,
  useAvatarMode,
  useAvatarCharacter,
  useAvatarConfig,
  readInteractiveAvatarFlag,
  readDefaultCharacterId,
} from './AvatarProvider'
export type { AvatarProviderProps } from './AvatarProvider'
export {
  AVATAR_CONFIGS,
  AVATAR_CHARACTER_IDS,
  DEFAULT_AVATAR_CHARACTER_ID,
  DEFAULT_AVATAR_SILHOUETTE,
  createAvatarAssets,
  getAvatarConfig,
  getExpressionScale,
  getGestureScale,
  isAvatarCharacterId,
  listAvatarConfigs,
  resolveAvatarCharacterId,
  avatarThemeToStyle,
  type AvatarCharacterId,
  type AvatarAssets,
  type AvatarClothingConfig,
  type AvatarConfig,
  type AvatarExpressionScales,
  type AvatarGestureScales,
  type AvatarHairConfig,
  type AvatarTheme,
  type AvatarVoiceProfileRef,
} from './AvatarConfig'
export { femaleTeacherConfig, maleTeacherConfig } from './characters'
export {
  AvatarExpressionProvider,
  useAvatarExpression,
  useAvatarExpressionOptional,
} from './AvatarExpressionProvider'
export type { AvatarExpressionProviderProps } from './AvatarExpressionProvider'
export { default as GifAvatar } from './GifAvatar'
export type { GifAvatarProps } from './GifAvatar'
export { default as InteractiveAvatar } from './InteractiveAvatar'
export type { InteractiveAvatarProps } from './InteractiveAvatar'
export {
  AVATAR_STATES,
  expressionToAvatarState,
  type AvatarState,
} from './AvatarState'
export {
  AVATAR_EXPRESSIONS,
  AVATAR_EXPRESSION_POSES,
  avatarStateToExpression,
  expressionToAvatarExpression,
  resolveAvatarExpression,
  type AvatarExpression,
  type AvatarExpressionPose,
} from './AvatarExpression'
export {
  avatarEyeVariants,
  avatarGlowVariants,
  avatarHeadVariants,
  avatarMouthVariants,
  avatarRootVariants,
} from './AvatarAnimations'
export { PHONEME_SHAPES, type PhonemeId } from './avatarPhonemes'
export {
  AvatarGestureProvider,
  useAvatarGesture,
  useAvatarGestureOptional,
  useAvatarGestureMotionOptional,
} from './AvatarGestureProvider'
export type { AvatarGestureProviderProps } from './AvatarGestureProvider'
export {
  AVATAR_GESTURES,
  GESTURE_PEAKS,
  NEUTRAL_GESTURE_OFFSET,
  type AvatarGestureName,
  type AvatarGestureOffset,
} from './avatarGestures'
export { useAvatarGestureEngine, type AvatarGestureMotion } from './useAvatarGestureEngine'
export { useAvatarExpressionEngine, type AvatarExpressionMotion } from './useAvatarExpressionEngine'
export { useAvatarTalking } from './useAvatarTalking'
export { useAvatarIdleLife, type AvatarIdleLifeOptions } from './useAvatarIdleLife'
export { useAvatarMouseTrack, type AvatarMouseTrackMotion } from './useAvatarMouseTrack'
export {
  createCompanionActionBag,
  runCompanionAction,
  type CompanionActionId,
} from './avatarCompanionScheduler'
export {
  AvatarMachineProvider,
  useAvatarMachineOutput,
  useAvatarMachineOutputOptional,
} from './AvatarMachineProvider'
export type { AvatarMachineProviderProps } from './AvatarMachineProvider'
export {
  AVATAR_MACHINE_STATES,
  AVATAR_HAPPY_PULSE_MS,
  AVATAR_MACHINE_PRIORITY,
  mapMachineStateToOutput,
  machineStateToLegacyExpression,
  type AvatarMachineInput,
  type AvatarMachineOutput,
  type AvatarMachineState,
} from './AvatarMachineState'
export {
  buildClassroomAvatarInput,
  buildVoiceDoubtAvatarInput,
  resolveTargetMachineState,
  transitionAvatarMachineState,
} from './avatarStateMachine'
export { useAvatarMachine } from './useAvatarMachine'
