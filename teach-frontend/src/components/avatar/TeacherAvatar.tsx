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
      <style>{`
        .teacher-avatar { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .avatar-body { position: relative; width: 140px; height: 180px; }
        .avatar-head { width: 70px; height: 70px; border-radius: 50%; background: var(--avatar-skin); margin: 0 auto; animation: breathe 3s ease-in-out infinite; }
        .avatar-torso { width: 90px; height: 90px; border-radius: 24px 24px 12px 12px; background: var(--avatar-shirt); margin: 0.5rem auto 0; }
        .avatar-arm { position: absolute; top: 88px; width: 18px; height: 60px; border-radius: 12px; background: var(--avatar-shirt); }
        .avatar-arm-left { left: 8px; transform: rotate(18deg); }
        .avatar-arm-right { right: 8px; transform: rotate(-18deg); }
        .teacher-avatar-speaking .avatar-head { animation: speak 0.35s ease-in-out infinite alternate; }
        .teacher-avatar-listening .avatar-head { transform: scale(1.03); }
        .teacher-avatar-questioning .avatar-arm-right { animation: point 1s ease-in-out infinite alternate; }
        .avatar-caption { max-width: 220px; text-align: center; color: var(--teach-muted); font-size: 0.95rem; }
        @keyframes breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes speak { from { transform: scale(1); } to { transform: scale(1.04); } }
        @keyframes point { from { transform: rotate(-18deg); } to { transform: rotate(-36deg); } }
      `}</style>
    </div>
  )
}
