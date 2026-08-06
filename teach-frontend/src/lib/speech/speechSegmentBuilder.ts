import { getPauseAfterMs } from './speechPause'
import { splitIntoSentences } from './sentenceChunker'
import type { SpeechSegment } from './types'

const DEFAULT_MAX_CHARS = 320
const LONG_SENTENCE_CHARS = 140

export interface SpeechSegmentBuilderOptions {
  maxChars?: number
  rate?: number
  pacingMs?: number
}

/**
 * Build natural narration segments for TTS — NOT tied to subtitle length.
 * Merges short sentences; splits long ones only at commas / clause boundaries.
 */
export function buildSpeechSegments(
  text: string,
  options?: SpeechSegmentBuilderOptions,
): SpeechSegment[] {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS
  const pauseOptions = { rate: options?.rate, pacingMs: options?.pacingMs }
  const trimmed = text.trim()
  if (trimmed === '') {
    return []
  }

  const sentences = splitIntoSentences(trimmed)
  const rawChunks: string[] = []

  for (const sentence of sentences) {
    if (sentence.length <= LONG_SENTENCE_CHARS) {
      rawChunks.push(sentence)
      continue
    }
    rawChunks.push(...splitLongSentenceNaturally(sentence, maxChars))
  }

  const merged = mergeSpeechChunks(rawChunks, maxChars)
  return merged.map((segmentText, id) => ({
    id,
    text: segmentText,
    pauseAfterMs: id < merged.length - 1
      ? getPauseAfterMs(segmentText, pauseOptions)
      : undefined,
  }))
}

function mergeSpeechChunks(chunks: string[], maxChars: number): string[] {
  const merged: string[] = []
  let buffer = ''

  for (const chunk of chunks) {
    const candidate = buffer === '' ? chunk : `${buffer} ${chunk}`
    if (candidate.length <= maxChars) {
      buffer = candidate
      continue
    }
    if (buffer !== '') {
      merged.push(buffer.trim())
    }
    buffer = chunk
  }

  if (buffer !== '') {
    merged.push(buffer.trim())
  }

  return merged.filter((part) => part !== '')
}

function splitLongSentenceNaturally(sentence: string, maxChars: number): string[] {
  const clauseParts = sentence.split(/(?<=[,;:—–-])\s+/).map((part) => part.trim()).filter((part) => part !== '')
  if (clauseParts.length <= 1) {
    return splitOnConjunctions(sentence, maxChars)
  }

  const merged: string[] = []
  let buffer = ''

  for (const clause of clauseParts) {
    const candidate = buffer === '' ? clause : `${buffer} ${clause}`
    if (candidate.length <= maxChars) {
      buffer = candidate
      continue
    }
    if (buffer !== '') {
      merged.push(buffer.trim())
    }
    if (clause.length > maxChars) {
      merged.push(...splitOnConjunctions(clause, maxChars))
      buffer = ''
    } else {
      buffer = clause
    }
  }

  if (buffer !== '') {
    merged.push(buffer.trim())
  }

  return merged.filter((part) => part !== '')
}

function splitOnConjunctions(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text]
  }

  const parts = text.split(/\s+(?=(?:and|but|so|because|which|when|while|although|however)\s+)/i)
  if (parts.length <= 1) {
    return hardSplit(text, maxChars)
  }

  return mergeSpeechChunks(parts, maxChars)
}

function hardSplit(text: string, maxChars: number): string[] {
  const parts: string[] = []
  let remaining = text.trim()
  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(' ', maxChars)
    if (splitAt < maxChars * 0.5) {
      splitAt = maxChars
    }
    parts.push(remaining.slice(0, splitAt).trim())
    remaining = remaining.slice(splitAt).trim()
  }
  if (remaining !== '') {
    parts.push(remaining)
  }
  return parts.filter((part) => part !== '')
}
