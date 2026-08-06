import { Avatar } from '../avatar'
import { CURRENT_TUTOR, getTutorLabel } from '../../lib/tutor'
import HeroFloatCard from './HeroFloatCard'
import { HERO_FLOAT_CARDS, polarPoint } from './heroSceneConfig'

const PARTICLE_SEEDS = [
  { x: 38, y: 28, delay: 0 },
  { x: 62, y: 24, delay: 1.2 },
  { x: 72, y: 52, delay: 0.4 },
  { x: 28, y: 58, delay: 0.8 },
  { x: 54, y: 72, delay: 1.6 },
  { x: 44, y: 42, delay: 2.1 },
]

/** Rich AI Tutor hero — Nova + contextual capability cards. */
export default function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-scene-field">
        <div className="hero-scene-radial hero-scene-radial-a" />
        <div className="hero-scene-radial hero-scene-radial-b" />
        <div className="hero-scene-ambient" />
      </div>

      <div className="hero-scene-rings" aria-hidden="true">
        <div className="hero-scene-ring hero-scene-ring-a" />
        <div className="hero-scene-ring hero-scene-ring-b" />
        <div className="hero-scene-ring hero-scene-ring-c" />
      </div>

      <svg className="hero-scene-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="hero-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--color-accent-bright)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {HERO_FLOAT_CARDS.map((card) => {
          const end = polarPoint(card.angle, card.radiusPx)
          const mid = polarPoint(card.angle, card.radiusPx * 0.5)
          return (
            <g key={card.id}>
              <line
                x1="50"
                y1="50"
                x2={end.x}
                y2={end.y}
                className="hero-scene-connection-line"
              />
              <circle
                cx={mid.x}
                cy={mid.y}
                r="0.55"
                className="hero-scene-knowledge-node"
                style={{ animationDelay: `${card.floatDelay}s` }}
              />
            </g>
          )
        })}
      </svg>

      <div className="hero-scene-particles" aria-hidden="true">
        {PARTICLE_SEEDS.map((particle, index) => (
          <span
            key={index}
            className="hero-scene-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="hero-scene-orbit hero-scene-orbit-a">
        {HERO_FLOAT_CARDS.map((card) => (
          <HeroFloatCard key={card.id} card={card} />
        ))}
      </div>

      <div className="hero-scene-tutor">
        <div className="hero-scene-tutor-halo" />
        <div className="hero-scene-tutor-pulse" />
        <div className="hero-scene-tutor-glow" />
        <div className="hero-scene-tutor-ring hero-scene-tutor-ring-a" />
        <div className="hero-scene-tutor-ring hero-scene-tutor-ring-b" />
        <div className="hero-scene-narration-wave" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <Avatar
          mentorId={CURRENT_TUTOR.id}
          asset={CURRENT_TUTOR.avatar}
          label={getTutorLabel()}
          isTalking={true}
          state="idle"
        />
        <div className="hero-scene-tutor-nameplate">
          <div className="hero-scene-tutor-nameplate-top">
            <span className="hero-scene-live-dot" />
            <span className="hero-scene-tutor-status">Narrating</span>
          </div>
          <p className="hero-scene-tutor-name">{CURRENT_TUTOR.name}</p>
          <p className="hero-scene-tutor-role">{CURRENT_TUTOR.role}</p>
        </div>
      </div>
    </div>
  )
}
