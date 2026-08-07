/**
 * Splits text into natural speech chunks for sequential TTS playback.
 * Frontend-only — does not alter API payloads beyond sending shorter strings.
 */

const SENTENCE_END = /(?<=[.!?…])\s+/

export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim()
  if (trimmed === '') {
    return []
  }

  const raw = trimmed.split(SENTENCE_END).map((s) => s.trim()).filter((s) => s !== '')
  if (raw.length === 0) {
    return [trimmed]
  }
  return raw
}

export function chunkTextForSpeech(text: string, maxCharsPerChunk: number): string[] {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) {
    return []
  }

  const chunks: string[] = []
  let buffer = ''

  for (const sentence of sentences) {
    if (sentence.length > maxCharsPerChunk) {
      if (buffer !== '') {
        chunks.push(buffer.trim())
        buffer = ''
      }
      chunks.push(...splitLongSentence(sentence, maxCharsPerChunk))
      continue
    }

    const candidate = buffer === '' ? sentence : `${buffer} ${sentence}`
    if (candidate.length <= maxCharsPerChunk) {
      buffer = candidate
    } else {
      if (buffer !== '') {
        chunks.push(buffer.trim())
      }
      buffer = sentence
    }
  }

  if (buffer !== '') {
    chunks.push(buffer.trim())
  }

  return chunks
}

function splitLongSentence(sentence: string, maxChars: number): string[] {
  const parts: string[] = []
  const clauses = sentence.split(/(?<=[,;:—–-])\s+/)
  let buffer = ''

  for (const clause of clauses) {
    if (clause.length > maxChars) {
      if (buffer !== '') {
        parts.push(buffer.trim())
        buffer = ''
      }
      for (let i = 0; i < clause.length; i += maxChars) {
        parts.push(clause.slice(i, i + maxChars).trim())
      }
      continue
    }

    const candidate = buffer === '' ? clause : `${buffer} ${clause}`
    if (candidate.length <= maxChars) {
      buffer = candidate
    } else {
      if (buffer !== '') {
        parts.push(buffer.trim())
      }
      buffer = clause
    }
  }

  if (buffer !== '') {
    parts.push(buffer.trim())
  }

  return parts.filter((p) => p !== '')
}

export function buildSpeechChunks(
  text: string,
  options: { chunkSpeech: boolean; maxCharsPerChunk: number },
): string[] {
  if (!options.chunkSpeech) {
    const trimmed = text.trim()
    return trimmed === '' ? [] : [trimmed]
  }
  return chunkTextForSpeech(text, options.maxCharsPerChunk)
}
