const STORAGE_KEY = 'teach_topic_progress'

export interface TopicProgressEntry {
  lastOpenedAt: string | null
  progressPercent: number
  taughtLessonCount: number
  totalLessons: number
}

type TopicProgressStore = Record<string, TopicProgressEntry>

function loadStore(): TopicProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return {}
    }
    return JSON.parse(raw) as TopicProgressStore
  } catch {
    return {}
  }
}

function saveStore(store: TopicProgressStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getAllTopicProgress(): TopicProgressStore {
  return loadStore()
}

export function getTopicProgress(topicId: string): TopicProgressEntry | null {
  return loadStore()[topicId] ?? null
}

export function recordTopicOpened(topicId: string, totalLessons: number): void {
  const store = loadStore()
  const existing = store[topicId]
  store[topicId] = {
    lastOpenedAt: new Date().toISOString(),
    progressPercent: existing?.progressPercent ?? 0,
    taughtLessonCount: existing?.taughtLessonCount ?? 0,
    totalLessons: totalLessons > 0 ? totalLessons : (existing?.totalLessons ?? 0),
  }
  saveStore(store)
}

export function updateTopicProgress(
  topicId: string,
  taughtLessonCount: number,
  totalLessons?: number,
): void {
  const store = loadStore()
  const existing = store[topicId]
  const resolvedTotal = (totalLessons ?? 0) > 0
    ? (totalLessons as number)
    : (existing?.totalLessons ?? 0)
  if (resolvedTotal <= 0) {
    return
  }
  const clampedTaught = Math.max(0, Math.min(taughtLessonCount, resolvedTotal))
  const progressPercent = Math.round((clampedTaught / resolvedTotal) * 100)
  store[topicId] = {
    lastOpenedAt: existing?.lastOpenedAt ?? new Date().toISOString(),
    progressPercent,
    taughtLessonCount: clampedTaught,
    totalLessons: resolvedTotal,
  }
  saveStore(store)
}
