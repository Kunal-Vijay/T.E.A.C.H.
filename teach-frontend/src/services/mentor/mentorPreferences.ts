import type { AnimationIntensity } from '../../types/mentor.types'

const SPEECH_MUTED_KEY = 'teach_mentor_speech_muted'
const ANIMATION_INTENSITY_KEY = 'teach_mentor_animation_intensity'

export function isMentorSpeechMuted(): boolean {
  return localStorage.getItem(SPEECH_MUTED_KEY) === '1'
}

export function setMentorSpeechMuted(muted: boolean): void {
  localStorage.setItem(SPEECH_MUTED_KEY, muted ? '1' : '0')
  window.dispatchEvent(new Event('teach-mentor-preferences'))
}

export function getAnimationIntensity(): AnimationIntensity {
  const stored = localStorage.getItem(ANIMATION_INTENSITY_KEY)
  if (stored === 'full' || stored === 'reduced' || stored === 'minimal') {
    return stored
  }
  return 'full'
}

export function setAnimationIntensity(intensity: AnimationIntensity): void {
  localStorage.setItem(ANIMATION_INTENSITY_KEY, intensity)
  window.dispatchEvent(new Event('teach-mentor-preferences'))
}

export function resolveAnimationIntensity(
  userPreference: AnimationIntensity,
  prefersReducedMotion: boolean,
): AnimationIntensity {
  if (prefersReducedMotion) {
    return 'minimal'
  }
  return userPreference
}
