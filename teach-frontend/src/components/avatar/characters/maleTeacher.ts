import { createAvatarAssets } from '../AvatarAssets'
import type { AvatarConfig } from '../AvatarTheme'

/** Cute male teacher — calm palette with polo styling. */
export const maleTeacherConfig: AvatarConfig = {
  id: 'male-teacher',
  name: 'Mr. Eli',
  theme: {
    accent: '#2563eb',
    accentSoft: '#93c5fd',
    secondary: '#38bdf8',
    glow: '#7dd3fc',
    skin: '#fde8d0',
    hair: '#1e293b',
    hairHighlight: '#334155',
    clothing: '#1d4ed8',
    clothingAccent: '#bfdbfe',
    eye: '#0f172a',
    lip: '#9f1239',
  },
  assets: createAvatarAssets(),
  hair: {
    variant: 'neat-short',
    tuftCount: 3,
    showBangs: false,
  },
  clothing: {
    variant: 'polo',
    showCollar: true,
  },
  expressions: {
    idle: 1,
    happy: 1,
    excited: 0.92,
    thinking: 1.02,
    confused: 1,
    surprised: 1,
    sad: 1,
    celebrating: 0.98,
    listening: 1.03,
    teaching: 1.02,
  },
  gestures: {
    default: 1,
    pointLeft: 1.04,
    pointRight: 1.04,
    explain: 1.06,
    thumbsUp: 1.03,
  },
  voice: {
    voiceId: 'teacher-male-calm',
    pitch: 0.94,
    tempo: 0.98,
  },
}
