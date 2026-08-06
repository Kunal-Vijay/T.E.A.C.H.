interface TeachLogoProps {
  size?: 'large' | 'medium'
  showTagline?: boolean
}

export default function TeachLogo({ size = 'medium', showTagline = true }: TeachLogoProps) {
  return (
    <div className={`teach-logo teach-logo-${size}${showTagline ? '' : ' teach-logo-compact'}`}>
      <span className="teach-logo-mark">T.E.A.C.H</span>
      {showTagline ? (
        <span className="teach-logo-tagline">
          Teacherless Education through Autonomous Cognitive Heuristics
        </span>
      ) : null}
    </div>
  )
}
