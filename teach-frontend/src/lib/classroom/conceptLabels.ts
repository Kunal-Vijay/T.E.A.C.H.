import type { TeachingBeat } from './teachingBeats'

/** Ordered concept labels derived from teaching beats (slide bullet_list). */
export function extractConceptLabels(beats: TeachingBeat[]): string[] {
  const byIndex = new Map<number, string>()

  for (const beat of beats) {
    const index = beat.conceptIndex
    const text = beat.conceptText?.trim()
    if (index === undefined || text === '' || text === undefined) {
      continue
    }
    if (!byIndex.has(index)) {
      byIndex.set(index, text)
    }
  }

  return Array.from(byIndex.entries())
    .sort(([a], [b]) => a - b)
    .map(([, label]) => label)
}
