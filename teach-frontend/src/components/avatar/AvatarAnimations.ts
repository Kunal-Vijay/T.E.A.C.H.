import type { Transition, Variants } from 'framer-motion'

const GPU_EASE = [0.22, 1, 0.36, 1] as const

const springTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.85,
}

const floatTransition: Transition = {
  duration: 3.2,
  repeat: Infinity,
  repeatType: 'mirror',
  ease: GPU_EASE,
}

export const avatarRootVariants: Variants = {
  idle: {
    y: 0,
    scale: 1,
    rotate: 0,
  },
  listening: {
    y: 0,
    scale: 1.03,
    rotate: 0,
    transition: springTransition,
  },
  thinking: {
    y: [0, -2, 0],
    rotate: [-1.5, 1.5, -1.5],
    scale: 1,
    transition: { ...floatTransition, duration: 2.4 },
  },
  talking: {
    y: [0, -3, 0],
    scale: [1, 1.025, 1],
    rotate: 0,
    transition: { duration: 0.45, repeat: Infinity, ease: GPU_EASE },
  },
  happy: {
    y: [0, -6, 0],
    scale: [1, 1.04, 1],
    rotate: [0, 1.5, 0],
    transition: { ...floatTransition, duration: 2.6 },
  },
  confused: {
    y: 0,
    scale: 1,
    rotate: [-2, 2, -2],
    transition: { duration: 1.8, repeat: Infinity, ease: GPU_EASE },
  },
  celebrating: {
    y: [0, -10, 0],
    scale: [1, 1.06, 1],
    rotate: [0, 2, -2, 0],
    transition: { duration: 0.85, repeat: Infinity, ease: GPU_EASE },
  },
}

export const avatarGlowVariants: Variants = {
  idle: {
    opacity: 0.58,
    scale: 1,
  },
  listening: {
    opacity: 0.75,
    scale: 1.08,
    transition: springTransition,
  },
  thinking: {
    opacity: [0.5, 0.85, 0.5],
    scale: [1, 1.05, 1],
    transition: { duration: 2.2, repeat: Infinity, ease: GPU_EASE },
  },
  talking: {
    opacity: [0.6, 0.95, 0.6],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, repeat: Infinity, ease: GPU_EASE },
  },
  happy: {
    opacity: 0.85,
    scale: 1.12,
    transition: springTransition,
  },
  confused: {
    opacity: [0.4, 0.65, 0.4],
    scale: 1,
    transition: { duration: 1.6, repeat: Infinity, ease: GPU_EASE },
  },
  celebrating: {
    opacity: [0.7, 1, 0.7],
    scale: [1, 1.15, 1],
    transition: { duration: 0.7, repeat: Infinity, ease: GPU_EASE },
  },
}

export const avatarHeadVariants: Variants = {
  idle: { rotate: 0, y: 0 },
  listening: { rotate: -3, y: -1, transition: springTransition },
  thinking: { rotate: [0, 4, 0], y: -2, transition: { duration: 2.5, repeat: Infinity } },
  talking: { rotate: [0, -1.5, 1.5, 0], y: [0, -1, 0], transition: { duration: 0.35, repeat: Infinity } },
  happy: { rotate: 3, y: -2, transition: springTransition },
  confused: { rotate: -5, y: 0, transition: springTransition },
  celebrating: { rotate: [0, 5, -5, 0], y: [0, -3, 0], transition: { duration: 0.6, repeat: Infinity } },
}

export const avatarEyeVariants: Variants = {
  idle: { scaleY: 1, opacity: 1 },
  listening: { scaleY: 1.15, opacity: 1, transition: springTransition },
  thinking: { scaleY: [1, 0.35, 1], opacity: [1, 0.7, 1], transition: { duration: 2.2, repeat: Infinity } },
  talking: { scaleY: 1, opacity: 1 },
  happy: { scaleY: 0.55, opacity: 1, transition: springTransition },
  confused: { scaleY: 1.2, opacity: [1, 0.65, 1], transition: { duration: 1.4, repeat: Infinity } },
  celebrating: { scaleY: 0.4, opacity: 1, transition: springTransition },
}

export const avatarMouthVariants: Variants = {
  idle: { scaleX: 1, scaleY: 1, opacity: 0.85 },
  listening: { scaleX: 0.85, scaleY: 1, opacity: 0.9, transition: springTransition },
  thinking: { scaleX: 0.7, scaleY: 0.8, opacity: 0.75, transition: springTransition },
  talking: { scaleX: [0.85, 1.1, 0.9, 1.05], scaleY: [0.9, 1.15, 0.95, 1.1], opacity: 1, transition: { duration: 0.32, repeat: Infinity } },
  happy: { scaleX: 1.15, scaleY: 1.2, opacity: 1, transition: springTransition },
  confused: { scaleX: 0.75, scaleY: 0.9, opacity: 0.8, transition: springTransition },
  celebrating: { scaleX: 1.2, scaleY: 1.25, opacity: 1, transition: springTransition },
}
