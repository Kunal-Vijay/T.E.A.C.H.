import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import type { MentorGifAsset } from '../../lib/mentors/mentorAssets'
import type { MentorId } from '../../types/mentor.types'

export interface GifAvatarProps {
  mentorId: MentorId
  asset: MentorGifAsset
  label: string
  className?: string
  style?: CSSProperties
}

/** Default avatar — existing mentor GIF, unchanged behavior. */
export default function GifAvatar({
  mentorId,
  asset,
  label,
  className,
  style,
}: GifAvatarProps) {
  return (
    <img
      className={cn(
        'mentor-gif-avatar',
        `mentor-gif-${mentorId}`,
        `mentor-gif-blend-${asset.blendMode}`,
        className,
      )}
      src={asset.src}
      alt={label}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ mixBlendMode: asset.blendMode, ...style }}
    />
  )
}
