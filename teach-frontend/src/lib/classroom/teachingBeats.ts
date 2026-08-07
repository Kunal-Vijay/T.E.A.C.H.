import { normalizeBulletItems } from './lessonPlayback'
import { buildSubtitleCues } from '../speech/subtitleChunker'

export type BeatPhase = 'intro' | 'reveal' | 'explain' | 'visual' | 'recap'

export interface TeachingBeat {
  id: string
  phase: BeatPhase
  cueStart: number
  cueEnd: number
  title?: string
  conceptText?: string
  conceptIndex?: number
  imageUrl?: string | null
  keywords: string[]
  recapItems?: string[]
}

const STOP_WORDS = new Set([
  'that', 'this', 'with', 'from', 'when', 'what', 'which', 'their', 'there',
  'about', 'into', 'your', 'have', 'been', 'will', 'also', 'more', 'than',
  'they', 'them', 'then', 'each', 'such', 'very', 'just', 'like', 'some',
])

export function extractKeywords(text: string, max = 3): string[] {
  const cleaned = text.replace(/[*_`#\[\]()]/g, '')
  const words = cleaned.split(/\s+/).filter((word) => word.length > 3)
  const unique: string[] = []
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (lower === '' || STOP_WORDS.has(lower)) {
      continue
    }
    if (!unique.some((existing) => existing.toLowerCase() === lower)) {
      unique.push(word.replace(/[^a-zA-Z0-9-]/g, ''))
    }
    if (unique.length >= max) {
      break
    }
  }
  return unique
}

function extractHeading(elements: Array<Record<string, unknown>>): string {
  for (const element of elements) {
    if (String(element.type ?? '') === 'heading') {
      return String(element.content ?? '').trim()
    }
  }
  return ''
}

function extractImageUrl(elements: Array<Record<string, unknown>>): string | null {
  for (const element of elements) {
    if (String(element.type ?? '') === 'image') {
      const url = element.asset_url
      if (url !== null && url !== undefined && String(url).trim() !== '') {
        return String(url)
      }
    }
  }
  return null
}

/** Decompose a slide into a teaching rhythm: intro → reveal → explain → visual → recap. */
export function buildTeachingBeats(
  explanationText: string,
  slideElements: Array<Record<string, unknown>>,
): { beats: TeachingBeat[]; cues: string[] } {
  const cues = buildSubtitleCues(explanationText)
  const bullets = normalizeBulletItems(
    slideElements.find((element) => String(element.type ?? '') === 'bullet_list')?.content,
  )
  const heading = extractHeading(slideElements)
  const imageUrl = extractImageUrl(slideElements)

  if (cues.length === 0) {
    const fallbackText = bullets[0] ?? heading
    if (fallbackText.trim() === '') {
      return { beats: [], cues: [] }
    }
    return {
      cues: [],
      beats: [{
        id: 'concept-0',
        phase: 'reveal',
        cueStart: 0,
        cueEnd: 0,
        title: heading || undefined,
        conceptText: fallbackText,
        conceptIndex: 0,
        keywords: extractKeywords(fallbackText),
      }],
    }
  }

  const beats: TeachingBeat[] = []
  const introCueCount = Math.max(1, Math.round(cues.length * 0.1))
  const recapCueCount = Math.max(1, Math.round(cues.length * 0.08))
  const teachingCueCount = Math.max(1, cues.length - introCueCount - recapCueCount)

  beats.push({
    id: 'intro',
    phase: 'intro',
    cueStart: 0,
    cueEnd: introCueCount - 1,
    title: heading || undefined,
    keywords: extractKeywords(heading || (cues[0] ?? '')),
  })

  const conceptCount = Math.max(1, bullets.length)
  const cuesPerConcept = Math.max(1, Math.floor(teachingCueCount / conceptCount))
  let cueCursor = introCueCount

  for (let index = 0; index < conceptCount; index += 1) {
    const conceptText = bullets[index] ?? heading
    const keywords = extractKeywords(conceptText)
    const isLast = index === conceptCount - 1
    const conceptCueBudget = isLast
      ? cues.length - recapCueCount - cueCursor
      : cuesPerConcept
    const revealEnd = cueCursor
    const explainEnd = Math.min(cues.length - recapCueCount - 1, cueCursor + conceptCueBudget - 1)

    if (conceptText.trim() !== '') {
      if (explainEnd <= revealEnd) {
        beats.push({
          id: `explain-${index}`,
          phase: 'explain',
          cueStart: revealEnd,
          cueEnd: revealEnd,
          title: heading || undefined,
          conceptText,
          conceptIndex: index,
          keywords,
        })
      } else {
        beats.push({
          id: `reveal-${index}`,
          phase: 'reveal',
          cueStart: revealEnd,
          cueEnd: revealEnd,
          title: heading || undefined,
          conceptText,
          conceptIndex: index,
          keywords,
        })

        beats.push({
          id: `explain-${index}`,
          phase: 'explain',
          cueStart: revealEnd + 1,
          cueEnd: explainEnd,
          title: heading || undefined,
          conceptText,
          conceptIndex: index,
          keywords,
        })
      }
    }

    cueCursor = explainEnd + 1

    if (isLast && imageUrl !== null && cueCursor < cues.length - recapCueCount) {
      beats.push({
        id: 'visual',
        phase: 'visual',
        cueStart: cueCursor,
        cueEnd: Math.min(cueCursor, cues.length - recapCueCount - 1),
        conceptText,
        conceptIndex: index,
        imageUrl,
        keywords,
      })
      cueCursor += 1
    }
  }

  beats.push({
    id: 'recap',
    phase: 'recap',
    cueStart: Math.max(0, cues.length - recapCueCount),
    cueEnd: cues.length - 1,
    title: heading || undefined,
    recapItems: bullets.length > 0 ? bullets : [heading].filter((item) => item.trim() !== ''),
    keywords: extractKeywords(heading),
  })

  return { beats, cues }
}

export function findBeatForCue(beats: TeachingBeat[], cueIndex: number): TeachingBeat | null {
  if (beats.length === 0) {
    return null
  }
  const match = beats.find((beat) => cueIndex >= beat.cueStart && cueIndex <= beat.cueEnd)
  return match ?? beats[beats.length - 1] ?? null
}

export function findBeatIndex(beats: TeachingBeat[], cueIndex: number): number {
  const index = beats.findIndex((beat) => cueIndex >= beat.cueStart && cueIndex <= beat.cueEnd)
  return index >= 0 ? index : beats.length - 1
}
