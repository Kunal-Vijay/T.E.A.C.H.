import { topicApi } from '../services/api/topicApi'
import type { TopicResponse } from '../types/learning.types'

export function formatRecordingDate(isoDate: string | null | undefined): string | null {
  if (isoDate == null || isoDate === '') {
    return null
  }
  const recorded = new Date(isoDate)
  if (Number.isNaN(recorded.getTime())) {
    return null
  }
  return recorded.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function resolveRecordingStatus(progressPercent: number): 'Completed' | 'Recorded' {
  return progressPercent >= 100 ? 'Completed' : 'Recorded'
}

export async function fetchAllPublishedTopics(): Promise<TopicResponse[]> {
  const limit = 50
  let page = 1
  let totalPages = 1
  const items: TopicResponse[] = []

  while (page <= totalPages) {
    const response = await topicApi.list({ status: 'published', page, limit })
    items.push(...response.data.items)
    totalPages = response.data.total_pages > 0 ? response.data.total_pages : 1
    page += 1
  }

  return items
}

export function resolveTopicChapterLabel(topic: TopicResponse): string | null {
  const firstLesson = topic.toc_items[0]?.title
  if (firstLesson == null || firstLesson === topic.title) {
    return null
  }
  return firstLesson
}
