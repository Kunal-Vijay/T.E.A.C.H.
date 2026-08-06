import { motion, type MotionStyle } from 'framer-motion'
import type { AvatarClothingConfig, AvatarHairConfig } from './AvatarTheme'

const HAIR_TUFT_LABELS = ['a', 'b', 'c', 'd', 'e'] as const

interface InteractiveAvatarHairProps {
  hair: AvatarHairConfig
  style?: MotionStyle
}

/** Procedural hair driven by AvatarConfig — no duplicated avatar components. */
export function InteractiveAvatarHair({ hair, style }: InteractiveAvatarHairProps) {
  const tufts = HAIR_TUFT_LABELS.slice(0, hair.tuftCount)

  return (
    <motion.div
      className={`interactive-avatar-hair interactive-avatar-hair--${hair.variant}`}
      style={style}
      initial={false}
    >
      {tufts.map((label) => (
        <span
          key={label}
          className={`interactive-avatar-hair-tuft interactive-avatar-hair-tuft-${label}`}
        />
      ))}
      {hair.showBangs ? (
        <span className="interactive-avatar-hair-bangs" aria-hidden="true" />
      ) : null}
    </motion.div>
  )
}

export function InteractiveAvatarClothing({ clothing }: { clothing: AvatarClothingConfig }) {
  return (
    <>
      <div className={`interactive-avatar-body interactive-avatar-clothing--${clothing.variant}`} />
      {clothing.showCollar ? (
        <span className="interactive-avatar-collar" aria-hidden="true" />
      ) : null}
    </>
  )
}
