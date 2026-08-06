import { createAvatarAssets } from '../AvatarAssets'
import type { AvatarConfig } from '../AvatarTheme'

/** Cute female teacher — warm, soft palette with cardigan styling. */
export const femaleTeacherConfig: AvatarConfig = {
  id: 'female-teacher',
  name: 'Nova',
  theme: {
    accent: '#c026d3',
    accentSoft: '#f0abfc',
    secondary: '#f9a8d4',
    glow: '#f0abfc',
    skin: '#ffe8d6',
    hair: '#5c3d2e',
    hairHighlight: '#8b5e4b',
    clothing: '#7c3aed',
    clothingAccent: '#ddd6fe',
    eye: '#4a044e',
    lip: '#be185d',
  },
  assets: createAvatarAssets(),
  hair: {
    variant: 'soft-long',
    tuftCount: 5,
    showBangs: true,
  },
  clothing: {
    variant: 'cardigan',
    showCollar: true,
  },
  expressions: {
    idle: 1,
    happy: 1.05,
    excited: 0.95,
    thinking: 1,
    confused: 1,
    surprised: 1.02,
    sad: 0.98,
    celebrating: 1.04,
    listening: 1,
    teaching: 1,
  },
  gestures: {
    default: 1,
    wave: 1.08,
    openHands: 1.05,
    celebrate: 1.02,
    thinkingPose: 1,
  },
  voice: {
    voiceId: 'teacher-female-warm',
    pitch: 1.05,
    tempo: 0.96,
  },
}
