import { buildSubtitleCues, wordCount } from './subtitleChunker'
import type { SubtitleSegment } from './types'

const BASE_WORDS_PER_MINUTE = 158

export interface SubtitleTimelineOptions {
  /** Playback rate multiplier from voice profile. */
  rate?: number
  /** Delay before first subtitle (e.g. while mentor intro plays). */
  introDelayMs?: number
}

/** Time-based subtitle schedule — independent from TTS segment boundaries. */
export function buildSubtitleTimeline(
  explanationText: string,
  options?: SubtitleTimelineOptions,
): SubtitleSegment[] {
  const cues = buildSubtitleCues(explanationText)
  if (cues.length === 0) {
    return []
  }

  const rate = options?.rate ?? 1
  const msPerWord = 60000 / (BASE_WORDS_PER_MINUTE * rate)
  const introDelayMs = options?.introDelayMs ?? 0

  let wordsBefore = 0
  return cues.map((text, id) => {
    const startMs = introDelayMs + Math.round(wordsBefore * msPerWord)
    wordsBefore += wordCount(text)
    return { id, text, startMs }
  })
}

/** Estimate intro narration duration for subtitle offset. */
export function estimateSpeechDurationMs(text: string, rate = 1): number {
  const words = wordCount(text)
  if (words === 0) {
    return 0
  }
  return Math.round((words / (BASE_WORDS_PER_MINUTE * rate)) * 60000)
}
