import type { CSSProperties } from 'react'
import Icon from '../ui/Icon'
import type { HeroFloatCardConfig } from './heroSceneConfig'

interface HeroFloatCardProps {
  card: HeroFloatCardConfig
}

function HeroFloatCardBody({ card }: HeroFloatCardProps) {
  switch (card.variant) {
    case 'narration':
    case 'question':
    case 'explain':
      return (
        <p className="hero-float-quote">{card.quote}</p>
      )
    case 'lesson':
      return (
        <>
          <p className="hero-float-lesson-title">{card.lessonTitle}</p>
          {card.chips != null && card.chips.length > 0 ? (
            <ul className="hero-float-chips" aria-label="Lesson topics">
              {card.chips.map((chip) => (
                <li key={chip}>
                  <span className="hero-float-chip-check" aria-hidden="true">✓</span>
                  {chip}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )
    case 'progress':
      return (
        <>
          <div className="hero-float-progress-row">
            <span className="hero-float-progress-value">{card.progress}%</span>
            <span className="hero-float-progress-label">{card.body}</span>
          </div>
          <div className="hero-float-progress-track" aria-hidden="true">
            <span
              className="hero-float-progress-fill"
              style={{ width: `${card.progress ?? 0}%` }}
            />
          </div>
        </>
      )
    default:
      return card.body != null ? <p className="hero-float-body">{card.body}</p> : null
  }
}

export default function HeroFloatCard({ card }: HeroFloatCardProps) {
  const style = {
    '--orbit-angle': `${card.angle}deg`,
    '--orbit-radius': `${card.radiusPx}px`,
    '--card-tilt': `${card.tilt}deg`,
    '--float-delay': `${card.floatDelay}s`,
    '--card-elevation': card.elevation,
  } as CSSProperties

  return (
    <div
      className={`hero-orbit-item hero-orbit-item--elev-${card.elevation}`}
      style={style}
    >
      <div className="hero-orbit-item-inner">
        <article className={`hero-float-card hero-float-card--${card.variant}`}>
        <header className="hero-float-card-head">
          <span className="hero-float-icon-wrap hero-float-icon-wrap--teal" aria-hidden="true">
            <Icon icon={card.icon} size={15} strokeWidth={1.75} />
          </span>
          <p className="hero-float-kicker">{card.title}</p>
          {card.variant === 'narration' ? (
            <span className="hero-float-live-pill" aria-hidden="true">
              <span className="hero-float-live-dot" />
              Live
            </span>
          ) : null}
        </header>
        <HeroFloatCardBody card={card} />
        </article>
      </div>
    </div>
  )
}
