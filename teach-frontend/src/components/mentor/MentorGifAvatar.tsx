import type { MentorGifAsset } from '../../lib/mentors/mentorAssets'
import type { MentorId } from '../../types/mentor.types'

interface MentorGifAvatarProps {
  mentorId: MentorId
  asset: MentorGifAsset
  label: string
}

export default function MentorGifAvatar({ mentorId, asset, label }: MentorGifAvatarProps) {
  return (
    <img
      className={`mentor-gif-avatar mentor-gif-${mentorId} mentor-gif-blend-${asset.blendMode}`}
      src={asset.src}
      alt={label}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ mixBlendMode: asset.blendMode }}
    />
  )
}
