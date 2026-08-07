import { splitIntoSentences } from './sentenceChunker'

const MAX_WORDS = 15
const TARGET_WORDS = 10

/** Short subtitle cues for live classroom (8–15 words). */
export function buildSubtitleCues(text: string): string[] {
  const trimmed = text.trim()
  if (trimmed === '') {
    return []
  }

  const cues: string[] = []
  for (const sentence of splitIntoSentences(trimmed)) {
    const words = sentence.split(/\s+/).filter((w) => w !== '')
    if (words.length <= MAX_WORDS) {
      cues.push(sentence)
      continue
    }
    for (let i = 0; i < words.length; i += TARGET_WORDS) {
      cues.push(words.slice(i, i + TARGET_WORDS).join(' '))
    }
  }

  return cues.length > 0 ? cues : [trimmed]
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w !== '').length
}
