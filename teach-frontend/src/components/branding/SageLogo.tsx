export default function SageLogo() {
  return (
    <div className="sage-logo">
      <div className="sage-logo-icon">🧠</div>
      <div>
        <div className="sage-logo-title">SAGE</div>
        <div className="sage-logo-tagline">Smart AI for Guided Explanations</div>
      </div>
      <style>{`
        .sage-logo { display: flex; align-items: center; gap: 0.75rem; }
        .sage-logo-icon { width: 42px; height: 42px; border-radius: 12px; background: var(--sage-bg); display: grid; place-items: center; font-size: 1.25rem; }
        .sage-logo-title { font-weight: 800; color: var(--sage-primary); letter-spacing: 0.08em; }
        .sage-logo-tagline { font-size: 0.8rem; color: var(--sage-text); }
      `}</style>
    </div>
  )
}
