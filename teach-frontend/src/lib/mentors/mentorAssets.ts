import type { TutorId } from '../../types/mentor.types'

export interface MentorGifAsset {
  src: string
  blendMode: 'screen' | 'normal'
}

/** Nova GIF — teach-frontend/public/ */
export const MENTOR_GIF_ASSETS: Record<TutorId, MentorGifAsset> = {
  nova: {
    src: '/video-from-rawpixel-id-17246652-gif.gif',
    blendMode: 'screen',
  },
}

export function getMentorGifAsset(tutorId: TutorId): MentorGifAsset {
  return MENTOR_GIF_ASSETS[tutorId]
}

export function getMentorGifUrl(tutorId: TutorId): string {
  return MENTOR_GIF_ASSETS[tutorId].src
}

export function mentorHasGifAsset(tutorId: TutorId): boolean {
  return tutorId in MENTOR_GIF_ASSETS
}
