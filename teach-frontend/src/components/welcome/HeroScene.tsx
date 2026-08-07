import { NovaTutor } from '../nova'
import { CURRENT_TUTOR } from '../../lib/tutor'
import HeroFloatCard from './HeroFloatCard'
import {
  HERO_FLOAT_CARDS,
  HERO_NOVA_SAFE_RADIUS_PX,
  HERO_SCENE_SIZE,
  polarPoint,
} from './heroSceneConfig'

/** Nova-forward hero — artwork is the primary visual; cards orbit outside the face. */
export default function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-scene-stage">
        <div className="hero-scene-field" aria-hidden="true">
          <div className="hero-scene-radial hero-scene-radial-a" />
          <div className="hero-scene-radial hero-scene-radial-b" />
          <div className="hero-scene-ambient" />
        </div>

        <div className="hero-scene-rings" aria-hidden="true">
          <div className="hero-scene-ring hero-scene-ring-a" />
          <div className="hero-scene-ring hero-scene-ring-b" />
          <div className="hero-scene-ring hero-scene-ring-c" />
        </div>

        <svg
          className="hero-scene-connections"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hero-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.08" />
              <stop offset="50%" stopColor="var(--color-accent-bright)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          {HERO_FLOAT_CARDS.map((card) => {
            const start = polarPoint(card.angle, HERO_NOVA_SAFE_RADIUS_PX, HERO_SCENE_SIZE)
            const end = polarPoint(card.angle, card.radiusPx, HERO_SCENE_SIZE)
            const mid = polarPoint(card.angle, (HERO_NOVA_SAFE_RADIUS_PX + card.radiusPx) * 0.55, HERO_SCENE_SIZE)
            return (
              <g key={card.id}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className="hero-scene-connection-line"
                />
                <circle
                  cx={mid.x}
                  cy={mid.y}
                  r="0.45"
                  className="hero-scene-knowledge-node"
                  style={{ animationDelay: `${card.floatDelay}s` }}
                />
              </g>
            )
          })}
        </svg>

        <div className="hero-scene-orbit hero-scene-orbit-a" aria-hidden="true">
          {HERO_FLOAT_CARDS.map((card) => (
            <HeroFloatCard key={card.id} card={card} />
          ))}
        </div>

        <div className="hero-scene-tutor">
          <NovaTutor speaking={false} size="hero" label="" />
          <div className="hero-scene-tutor-nameplate">
            <p className="hero-scene-tutor-name">{CURRENT_TUTOR.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
