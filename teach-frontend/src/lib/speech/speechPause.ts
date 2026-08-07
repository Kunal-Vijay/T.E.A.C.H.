/** Punctuation-aware inter-segment pauses for natural teacher-like pacing. */

export type PauseBoundary =
  | 'comma'
  | 'colon'
  | 'semicolon'
  | 'period'
  | 'question'
  | 'exclamation'
  | 'ellipsis'
  | 'none'

/** [minMs, maxMs] — tuned for natural narration rhythm. */
const PAUSE_RANGES: Record<PauseBoundary, readonly [number, number]> = {
  comma: [150, 250],
  colon: [250, 350],
  semicolon: [300, 400],
  period: [500, 700],
  question: [600, 800],
  exclamation: [450, 600],
  ellipsis: [550, 700],
  none: [80, 120],
}

export interface SpeechPauseOptions {
  /** Voice playback rate — faster speech uses slightly shorter gaps. */
  rate?: number
  /** Mentor baseline pacing (`pauseBetweenMs`) scales all pauses proportionally. */
  pacingMs?: number
}

/** Detect which punctuation ends a speech segment (ignores trailing quotes/brackets). */
export function detectTrailingBoundary(text: string): PauseBoundary {
  let trimmed = text.trim()
  while (trimmed.length > 0 && /[\s"'""'')\]}>]$/u.test(trimmed)) {
    trimmed = trimmed.slice(0, -1)
  }
  trimmed = trimmed.trimEnd()
  if (trimmed === '') {
    return 'none'
  }

  if (trimmed.endsWith('...') || trimmed.endsWith('…')) {
    return 'ellipsis'
  }

  const last = trimmed.slice(-1)
  switch (last) {
    case '?':
      return 'question'
    case '!':
      return 'exclamation'
    case '.':
      return 'period'
    case ',':
      return 'comma'
    case ':':
      return 'colon'
    case ';':
      return 'semicolon'
    default:
      return 'none'
  }
}

/** Stable jitter in range — same text always yields the same pause (consistent replays). */
function pauseInRange(text: string, min: number, max: number): number {
  if (min >= max) {
    return min
  }
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  const t = (Math.abs(hash) % 1000) / 1000
  return Math.round(min + t * (max - min))
}

/**
 * Milliseconds to wait after playing a segment, based on how it ends.
 * Comma → brief breath; sentence end → longer processing pause.
 */
export function getPauseAfterMs(text: string, options?: SpeechPauseOptions): number {
  const boundary = detectTrailingBoundary(text)
  const [min, max] = PAUSE_RANGES[boundary]
  const base = pauseInRange(text, min, max)

  const rate = Math.max(0.7, options?.rate ?? 1)
  const pacingScale = (options?.pacingMs ?? 500) / 500

  return Math.max(0, Math.round((base * pacingScale) / rate))
}
