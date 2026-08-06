import { memo } from 'react'
import { motion, type MotionValue } from 'framer-motion'
import type { AvatarClothingConfig, AvatarHairConfig } from './AvatarTheme'
import { InteractiveAvatarClothing, InteractiveAvatarHair } from './InteractiveAvatarParts'

export interface InteractiveAvatarAmbientProps {
  glowOpacity: MotionValue<number>
  glowScale: MotionValue<number>
  ambientOpacity: MotionValue<number>
  ambientScale: MotionValue<number>
  shadowScale: MotionValue<number>
  shadowOpacity: MotionValue<number>
}

export const InteractiveAvatarAmbient = memo(function InteractiveAvatarAmbient({
  glowOpacity,
  glowScale,
  ambientOpacity,
  ambientScale,
  shadowScale,
  shadowOpacity,
}: InteractiveAvatarAmbientProps) {
  return (
    <>
      <motion.div
        className="interactive-avatar-ambient"
        aria-hidden="true"
        style={{ opacity: ambientOpacity, scale: ambientScale }}
        initial={false}
      />
      <motion.div
        className="interactive-avatar-glow"
        aria-hidden="true"
        style={{ opacity: glowOpacity, scale: glowScale }}
        initial={false}
      />
      <motion.div
        className="interactive-avatar-shadow"
        aria-hidden="true"
        style={{ scaleX: shadowScale, opacity: shadowOpacity }}
        initial={false}
      />
    </>
  )
})

export interface InteractiveAvatarFaceProps {
  eyeScaleY: MotionValue<number>
  eyeX: MotionValue<number>
  eyeY: MotionValue<number>
  highlightY: MotionValue<number>
  browLeftY: MotionValue<number>
  browRightY: MotionValue<number>
  browLeftRotate: MotionValue<number>
  browRightRotate: MotionValue<number>
  mouthScaleX: MotionValue<number>
  mouthScaleY: MotionValue<number>
  mouthCurve: MotionValue<number>
  mouthOpacity: MotionValue<number>
  cheekFlush: MotionValue<number>
  headRotate: MotionValue<number>
  headY: MotionValue<number>
}

export const InteractiveAvatarFace = memo(function InteractiveAvatarFace({
  eyeScaleY,
  eyeX,
  eyeY,
  highlightY,
  browLeftY,
  browRightY,
  browLeftRotate,
  browRightRotate,
  mouthScaleX,
  mouthScaleY,
  mouthCurve,
  mouthOpacity,
  cheekFlush,
  headRotate,
  headY,
}: InteractiveAvatarFaceProps) {
  return (
    <motion.div
      className="interactive-avatar-head"
      style={{ rotate: headRotate, y: headY }}
      initial={false}
    >
      <motion.span
        className="interactive-avatar-cheek interactive-avatar-cheek-left"
        aria-hidden="true"
        style={{ opacity: cheekFlush }}
      />
      <motion.span
        className="interactive-avatar-cheek interactive-avatar-cheek-right"
        aria-hidden="true"
        style={{ opacity: cheekFlush }}
      />

      <div className="interactive-avatar-face">
        <div className="interactive-avatar-brows" aria-hidden="true">
          <motion.span
            className="interactive-avatar-brow interactive-avatar-brow-left"
            style={{ y: browLeftY, rotate: browLeftRotate }}
          />
          <motion.span
            className="interactive-avatar-brow interactive-avatar-brow-right"
            style={{ y: browRightY, rotate: browRightRotate }}
          />
        </div>

        <motion.div
          className="interactive-avatar-eyes"
          style={{ x: eyeX, y: eyeY }}
          initial={false}
        >
          <motion.span
            className="interactive-avatar-eye interactive-avatar-eye-left"
            style={{ scaleY: eyeScaleY }}
          >
            <motion.span
              className="interactive-avatar-eye-highlight"
              style={{ y: highlightY }}
            />
          </motion.span>
          <motion.span
            className="interactive-avatar-eye interactive-avatar-eye-right"
            style={{ scaleY: eyeScaleY }}
          >
            <motion.span
              className="interactive-avatar-eye-highlight"
              style={{ y: highlightY }}
            />
          </motion.span>
        </motion.div>

        <motion.span
          className="interactive-avatar-mouth"
          style={{
            scaleX: mouthScaleX,
            scaleY: mouthScaleY,
            rotate: mouthCurve,
            opacity: mouthOpacity,
          }}
          initial={false}
        />
      </div>
    </motion.div>
  )
})

export interface InteractiveAvatarBodyProps {
  hair: AvatarHairConfig
  clothing: AvatarClothingConfig
  hairY: MotionValue<number>
  hairRotate: MotionValue<number>
  bodyScale: MotionValue<number>
  shoulderLeftRotate: MotionValue<number>
  shoulderRightRotate: MotionValue<number>
  handLeftRotate: MotionValue<number>
  handLeftY: MotionValue<number>
  handRightRotate: MotionValue<number>
  handRightY: MotionValue<number>
}

export const InteractiveAvatarBody = memo(function InteractiveAvatarBody({
  hair,
  clothing,
  hairY,
  hairRotate,
  bodyScale,
  shoulderLeftRotate,
  shoulderRightRotate,
  handLeftRotate,
  handLeftY,
  handRightRotate,
  handRightY,
}: InteractiveAvatarBodyProps) {
  return (
    <>
      <InteractiveAvatarHair hair={hair} style={{ y: hairY, rotate: hairRotate }} />

      <motion.div
        className="interactive-avatar-body-wrap"
        style={{ scaleY: bodyScale }}
        initial={false}
      >
        <motion.span
          className="interactive-avatar-shoulder interactive-avatar-shoulder-left"
          aria-hidden="true"
          style={{ rotate: shoulderLeftRotate }}
        />
        <motion.span
          className="interactive-avatar-shoulder interactive-avatar-shoulder-right"
          aria-hidden="true"
          style={{ rotate: shoulderRightRotate }}
        />

        <InteractiveAvatarClothing clothing={clothing} />

        <motion.span
          className="interactive-avatar-hand interactive-avatar-hand-left"
          style={{ rotate: handLeftRotate, y: handLeftY }}
        />
        <motion.span
          className="interactive-avatar-hand interactive-avatar-hand-right"
          style={{ rotate: handRightRotate, y: handRightY }}
        />
      </motion.div>
    </>
  )
})

export const InteractiveAvatarDecorations = memo(function InteractiveAvatarDecorations() {
  return (
    <>
      <span className="interactive-avatar-spark interactive-avatar-spark-a" aria-hidden="true" />
      <span className="interactive-avatar-spark interactive-avatar-spark-b" aria-hidden="true" />
      <span className="interactive-avatar-spark interactive-avatar-spark-c" aria-hidden="true" />
      <span className="interactive-avatar-thought" aria-hidden="true">
        <span /><span /><span />
      </span>
    </>
  )
})
