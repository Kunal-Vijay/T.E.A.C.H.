import type { MentorId } from '../../types/mentor.types'

export interface MentorGifAsset {
  src: string
  blendMode: 'screen' | 'normal'
}

/** GIF loops in teach-frontend/public/ */
export const MENTOR_GIF_ASSETS: Record<MentorId, MentorGifAsset> = {
  nova: {
    src: '/video-from-rawpixel-id-17246652-gif.gif',
    blendMode: 'screen',
  },
  atlas: {
    src: '/0e9a7351d26a4ce31f276b4319ba1971.gif',
    blendMode: 'normal',
  },
  spark: {
    src: '/video-from-rawpixel-id-18087913-gif.gif',
    blendMode: 'screen',
  },
  luna: {
    src: '/video-from-rawpixel-id-17235443-gif.gif',
    blendMode: 'screen',
  },
  sage: {
    src: '/frink-professor-frink.gif',
    blendMode: 'normal',
  },
  pixel: {
    src: '/video-from-rawpixel-id-18087913-gif.gif',
    blendMode: 'screen',
  },
  astro: {
    src: '/video-from-rawpixel-id-18606000-gif.gif',
    blendMode: 'screen',
  },
  ember: {
    src: '/video-from-rawpixel-id-18171279-gif.gif',
    blendMode: 'screen',
  },
}

export function getMentorGifAsset(mentorId: MentorId): MentorGifAsset {
  return MENTOR_GIF_ASSETS[mentorId]
}

export function getMentorGifUrl(mentorId: MentorId): string {
  return MENTOR_GIF_ASSETS[mentorId].src
}

export function mentorHasGifAsset(mentorId: MentorId): boolean {
  return mentorId in MENTOR_GIF_ASSETS
}
