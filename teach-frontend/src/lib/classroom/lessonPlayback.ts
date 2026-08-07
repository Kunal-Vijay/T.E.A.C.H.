export function normalizeBulletItems(content: unknown): string[] {
  if (Array.isArray(content)) {
    return content.map((item) => String(item))
  }
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item))
        }
      } catch {
        /* fall through */
      }
    }
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
  }
  return []
}

export function extractBulletsFromElements(elements: Array<Record<string, unknown>>): string[] {
  const bullets: string[] = []
  for (const element of elements) {
    if (String(element.type ?? '') === 'bullet_list') {
      bullets.push(...normalizeBulletItems(element.content))
    }
  }
  return bullets
}

export interface BulletRevealState {
  revealedCount: number
  activeIndex: number | null
}

/** Maps subtitle cue progress to progressive bullet reveal. */
export function computeBulletReveal(
  cueIndex: number,
  totalCues: number,
  bulletCount: number,
): BulletRevealState {
  if (bulletCount === 0 || totalCues === 0) {
    return { revealedCount: 0, activeIndex: null }
  }

  const introCueCount = Math.max(1, Math.round(totalCues * 0.12))
  if (cueIndex < introCueCount) {
    return { revealedCount: 0, activeIndex: null }
  }

  const teachingCues = totalCues - introCueCount
  const cuesPerBullet = Math.max(1, Math.ceil(teachingCues / bulletCount))
  const teachingIndex = cueIndex - introCueCount
  const activeIndex = Math.min(bulletCount - 1, Math.floor(teachingIndex / cuesPerBullet))
  const revealedCount = activeIndex + 1

  return { revealedCount, activeIndex }
}
