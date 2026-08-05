interface TeachLogoProps {
  size?: 'large' | 'medium'
}

export default function TeachLogo({ size = 'medium' }: TeachLogoProps) {
  return (
    <div className={`teach-logo teach-logo-${size}`}>
      <span className="teach-logo-mark">TEACH</span>
      <span className="teach-logo-tagline">
        Teacherless Education through Autonomous Cognitive Heuristics
      </span>
      <style>{`
        .teach-logo { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; text-align: center; }
        .teach-logo-mark { font-size: ${size === 'large' ? '4rem' : '1.75rem'}; font-weight: 900; letter-spacing: 0.12em; color: var(--teach-primary); }
        .teach-logo-tagline { max-width: 34rem; color: var(--teach-muted); font-size: ${size === 'large' ? '1.05rem' : '0.85rem'}; line-height: 1.5; }
      `}</style>
    </div>
  )
}
