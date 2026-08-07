interface ProductAmbientProps {
  /** Stronger glow in live classroom */
  intensity?: 'hub' | 'classroom'
}

/** Shared ambient layer — landing, hub, and classroom visual DNA */
export default function ProductAmbient({ intensity = 'hub' }: ProductAmbientProps) {
  return (
    <div className={`teach-ambient teach-ambient--${intensity}`} aria-hidden="true">
      <div className="teach-ambient-mesh teach-ambient-mesh-a" />
      <div className="teach-ambient-mesh teach-ambient-mesh-b" />
      <div className="teach-ambient-scene" />
      <div className="teach-ambient-texture" />
      <div className="teach-ambient-grid" />
      <div className="teach-ambient-noise" />
      <div className="teach-ambient-lighting" />
      <div className="teach-ambient-overlay" />
      {intensity === 'classroom' ? (
        <div className="teach-ambient-particles">
          <span /><span /><span /><span /><span /><span />
        </div>
      ) : null}
    </div>
  )
}
