export type AvatarState = 'idle' | 'speaking' | 'listening' | 'questioning'

interface TeacherAvatarProps {
  state: AvatarState
  caption?: string
}

export default function TeacherAvatar({ state, caption }: TeacherAvatarProps) {
  return (
    <div className={`teacher-avatar teacher-avatar-${state}`}>
      <div className="avatar-body">
        <div className="avatar-head" />
        <div className="avatar-torso" />
        <div className="avatar-arm avatar-arm-left" />
        <div className="avatar-arm avatar-arm-right" />
      </div>
      {caption !== undefined && caption !== '' ? <p className="avatar-caption">{caption}</p> : null}
    </div>
  )
}
